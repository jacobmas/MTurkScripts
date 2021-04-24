// ==UserScript==
// @name         CrunchbaseLinkedIn
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Find LinkedIn given name title company
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_deleteValue
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @grant GM_cookie
// @grant GM.cookie
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/b0d02d4318a9d1ccb4056b417d54c87d772a5d6a/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/AggParser.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/nicknames.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A1VTGWXCRPJSXX",true);
    var MTP=MTurkScript.prototype;


    function matches_person_names(desired_name,found_name,i) {
        var parsed_desired=MTurkScript.prototype.parse_name(desired_name);
        var parsed_found=MTurkScript.prototype.parse_name(found_name);
        console.log("matches_person_names, parsed_desired="+JSON.stringify(parsed_desired)+", parsed_found="+JSON.stringify(parsed_found));
        if(parsed_desired.lname.toLowerCase()!=parsed_found.lname.toLowerCase()
          && found_name.toLowerCase().indexOf(parsed_desired.lname.toLowerCase())===-1&&parsed_desired.lname.replace(/^[a-z][^\s]*\s/,"").toLowerCase()!=parsed_found.lname.toLowerCase()
          )
        {
            if(!(/[A-Z]\.$/.test(parsed_found.lname)&&parsed_found.lname.substr(0,1)===parsed_desired.lname.substr(0,1))) {
                console.log("Returning false on lname");
                return false;
            }
        }
        if(parsed_desired.fname.toLowerCase()===parsed_found.fname.toLowerCase() ||
           parsed_desired.fname.toLowerCase().indexOf(parsed_found.fname.toLowerCase())!=-1 ||
              parsed_found.fname.toLowerCase().indexOf(parsed_desired.fname.toLowerCase())!=-1 ||
           found_name.toLowerCase().indexOf(parsed_desired.fname.toLowerCase())!=-1) {
            return true;
        }
        if(parsed_found.fname.split("-")[0].toLowerCase()===parsed_desired.fname.split("-")[0].toLowerCase()) return true;
        if(Nicknames[parsed_desired.fname.toLowerCase()]!=undefined && Nicknames[parsed_desired.fname.toLowerCase()].includes(parsed_found.fname.toLowerCase())) return true;
        if(Nicknames[parsed_found.fname.toLowerCase()]!=undefined && Nicknames[parsed_found.fname.toLowerCase()].includes(parsed_desired.fname.toLowerCase())) return true;

        return false;

    }


    function is_bad_name(name1,name2)
    {
        var parsed1=MTP.parse_name(name1),parsed2=MTP.parse_name(name2);
        return false;
    }

    function needs_update(person) {
        if(person.experience&&person.experience.length>0&&

           MTP.matches_names(my_query.company,person.experience[0].company)&& /Present/i.test(person.experience[0].time)) {
            console.log("needs_update, matches experience company name");
            return false;
        }
        if(person.type) {
            let at_split=person.type.split(/\s+at\s+/);
            if(MTP.matches_names(my_query.company,at_split[at_split.length-1]) ||
               person.type.toLowerCase().indexOf(MTP.shorten_company_name(my_query.company).toLowerCase())!==-1 ||
              MTP.shorten_company_name(my_query.company).toLowerCase().indexOf(at_split[at_split.length-1].toLowerCase())!=-1
              ) {
                console.log("needs_update, matches 'at' company name "+at_split[at_split.length-1]);
                return false;
            }
        }
        if(person.Current) {
            let at_split=person.Current.split(/\s+at\s+/);
            if(MTP.matches_names(my_query.company,at_split[at_split.length-1]) ||
               person.Current.toLowerCase().indexOf(MTP.shorten_company_name(my_query.company).toLowerCase())!==-1 ||
              MTP.shorten_company_name(my_query.company).toLowerCase().indexOf(at_split[at_split.length-1].toLowerCase())!=-1
              ) {
                console.log("needs_update, matches 'at' company name "+at_split[at_split.length-1]);
                return false;
            }
        }
        return true;
    }

    function thing_needs_update(person) {
        if(person.experience&&person.experience.length>0&&

           MTP.matches_names(my_query.company,person.experience[0].company)) {
            console.log("needs_update, matches experience company name");
            return false;
        }
        if(person.type) {
            let at_split=person.type.split(/\s+at\s+/);
            if(MTP.matches_names(my_query.company,at_split[at_split.length-1])) {
                console.log("needs_update, matches 'at' company name "+at_split[at_split.length-1]);
                return false;
            }
        }
        return true;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type+",try_count["+type+"]="+my_query.try_count[type]);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb,b_snippet;
        var good_url="";
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            b_snippet=doc.querySelector(".b_snippet");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
            if(parsed_context.thing && parsed_context.thing.linkedin_url && /\/in\//.test(parsed_context.thing.linkedin_url) && (matches_person_names(my_query.name,MTP.removeDiacritics(parsed_context.thing.name),my_query.try_count[type]))) {
                let update=thing_needs_update(parsed_context.thing);
                console.log("thing, update="+update);
                if(type==='query' &&  (my_query.try_count[type]<2 || !update || b_algo.length<=1)) {
                console.log("thing, update="+update);

                    resolve({url:parsed_context.thing.linkedin_url.replace(/(https?:\/\/[^\/]+\/in\/[^\/]+).*$/,"$1"),needs_update:update});
                    return;
                }

            }
            else if(parsed_context.thing && my_query.try_count[type]>2&&parsed_context.thing.Headquarters && /Korea|Japan|India|China|Thailand|Vietnam|Hong Kong/.test(parsed_context.thing.Headquarters)) {
                my_query.radios['choice-type']="na";
                my_query.fields.website="Doesn't Exist";
                submit_if_done();
                return;
            }


            if(parsed_context.person && parsed_context.person.linkedin_url && (matches_person_names(my_query.name,MTP.removeDiacritics(parsed_context.person.name),my_query.try_count[type]))) {
                var update=needs_update(parsed_context.person);
                console.log("person, update="+update);
                if(type==='query' && (my_query.try_count[type]<2 || !update || b_algo.length<=1)) {
                    console.log("resolving parsed_context.person");
                    resolve({url:parsed_context.person.linkedin_url.replace(/(https?:\/\/[^\/]+\/in\/[^\/]+).*$/,"$1"),needs_update:update});
                    return;
                }
            }
        }
            if(b_snippet) {
                console.log("b_snippet="+b_snippet.innerText.trim());
                if(my_query.try_count[type]>2&&b_snippet  && /Korea|Japan|India|China|Thailand|Vietnam|Hong Kong/.test(b_snippet.innerText.trim())) {
                    my_query.radios['choice-type']="na";
                    my_query.fields.website="Doesn't Exist";
                    submit_if_done();
                    return;
                }
            }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<2; i++) {
                //if(type==='query' && my_query.try_count[type]>0) break;
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].querySelector("h2 a").href;
                b_url=b_url.replace("https://www.linkedin.com/today/author/","https://www.linkedin.com/in/");
                if(!/linkedin.com\/in\//.test(b_url)) continue;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                b_factrow=b_algo[i].querySelector(".b_factrow")?MTP.parse_b_factrow(b_algo[i].querySelector(".b_factrow")):{};
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!/\/in\//.test(b_url)) continue;
                let split_link=b_name.replace(/\s*\|.*$/,"").split(/\s+[-–]\s+/);
                if(split_link.length>=3) split_link[2]=split_link[2].replace(/[\.\s]*$/,"").trim();
                console.log("split_link="+JSON.stringify(split_link));
                if(split_link.length>=3 && matches_person_names(my_query.name,MTP.removeDiacritics(split_link[0]),my_query.try_count[type]) && MTP.matches_names(my_query.company,split_link[2])) {
                    let update=!MTP.matches_names(MTP.shorten_company_name(my_query.company),split_link[2]);

                    resolve({url:b_url.replace(/(https?:\/\/[^\/]+\/in\/[^\/]+).*$/,"$1")});
                    return;
                }
                else if(my_query.try_count[type]<2 && i<=1 && split_link.length>=1 && matches_person_names(my_query.name,MTP.removeDiacritics(split_link[0]),my_query.try_count[type])) {
                    let update=split_link.length>=3?!MTP.matches_names(MTP.shorten_company_name(my_query.company),split_link[2]):false;

                    resolve({url:b_url.replace(/(https?:\/\/[^\/]+\/in\/[^\/]+).*$/,"$1"),needs_update:update});
                    return;
                }
                else if( type==="query"  && matches_person_names(my_query.name,MTP.removeDiacritics(split_link[0]),my_query.try_count[type])&&i<=1) {
                    if(p_caption.match(new RegExp(my_query.company,"i"))) {
                        let update=split_link.length>=3?(!MTP.matches_names(MTP.shorten_company_name(my_query.company),split_link[2])):false;
                        resolve({url:b_url.replace(/(https?:\/\/[^\/]+\/in\/[^\/]+).*$/,"$1"),needs_update:update});
                        return;

                    }
                    if(my_query.try_count[type]>0) {
                        console.log("Setting good url="+b_url);
                        good_url=b_url;
                    }
                    else {
                        console.log("TOO low");
                    }
                }
                else if(type==="url" && MTP.matches_names(my_query.name,split_link[0])&&i===0) {
                                        resolve({url:b_url.replace(/(https?:\/\/[^\/]+\/in\/[^\/]+).*$/,"$1")})
                    return;
                }


              /*  if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i)
		   && (b1_success=true)) break;*/
            }
        }
        catch(error) {
            reject(error);
            return;
        }
        /*if(good_url&&!my_query.queried_on_url) {
            my_query.queried_on_url=true;
            query_search(good_url+" +\""+my_query.company+"\" site:linkedin.com", resolve, reject, query_response,"url");
            return;
        }*/

	do_next_query(resolve,reject,type,b_algo.length);
        return;
    }
    function do_next_query(resolve,reject,type,b_algo_len) {
        var search_str;
        /*if(/query/.test(type) && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            search_str=""+my_query.parsed_name.fname+" "+my_query.parsed_name.lname+" +\""+MTP.shorten_company_name(my_query.company)+"\" site:linkedin.com/in";

            query_search(search_str, resolve, reject, query_response,"query");
            return;
        }*/
               if(/query/.test(type) && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            search_str=""+my_query.parsed_name.fname+" "+my_query.parsed_name.lname+" +\""+MTP.shorten_company_name(my_query.company).replace(/\s.*$/,"")+"\" site:linkedin.com/in";

            query_search(search_str, resolve, reject, query_response,"query");
            return;
        }
        if(/query/.test(type) && my_query.try_count[type]===1) {
            my_query.try_count[type]++;
            search_str=""+my_query.parsed_name.fname+" "+my_query.parsed_name.lname+" \""+MTP.shorten_company_name(my_query.company)+"\" site:linkedin.com/in";

            query_search(search_str, resolve, reject, query_response,"query");
            return;
        }
        if(/query/.test(type)&& my_query.try_count[type]===2) {
            /* try to determine if the location is India/China/Japan/etc */
            my_query.try_count[type]++;
            search_str=""+my_query.parsed_name.fname+" "+my_query.parsed_name.lname+" +\""+MTP.shorten_company_name(my_query.company)+"\"";

            query_search(search_str, resolve, reject, query_response,"query");
            return;
        }
        if(/query/.test(type) && my_query.try_count[type]===3) {
            my_query.try_count[type]++;
            search_str="+\""+MTP.shorten_company_name(my_query.company)+"\" company";

            query_search(search_str, resolve, reject, query_response,"query");
            return;
        }
        reject("Nothing found");
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type,filters) {
        console.log("Searching with bing for "+search_str);
        if(!filters) filters="";
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&filters="+filters+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        console.log("query_promise_then="+result);
        my_query.fields.website=result.url.replace(/https:\/\/[^\.]+\./,"https://www.")
        .replace(/\?.*$/,"").replace(/\#.*$/,"");
        my_query.radios['choice-type']=result.needs_update?"yes":"no";

        submit_if_done();
    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0; 
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }

    function add_to_sheet() {
        var x,field,radio;
        for(x in my_query.fields) {
            console.log("x="+x+",my_query.fields[x]="+my_query.fields[x]);
            if((MTurk.is_crowd && (field=document.getElementsByName(x)[0])) ||
               (!MTurk.is_crowd && (field=document.getElementById(x)))) field.value=my_query.fields[x];
            else {
                console.log(document.getElementsByName(x)[0]);
            }

        }
        for(x in my_query.radios) {
            console.log("x="+x+",my_query.radios[x]="+my_query.radios[x]);
            if((radio=document.getElementById(my_query.radios[x]))) {
                console.log("radio="+radio.outerHTML);
                radio.click();
            }

        }
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) {
              let success_count=GM_getValue("successCount",0);
            GM_setValue("successCount",success_count+1);
            MTurk.check_and_submit();
        }
    }

    function init_Query()
    {
        let fail_count=GM_getValue("failCount",0),success_count=GM_getValue("successCount",0);
        var total=success_count+fail_count;
        console.log("in init_query, success_count="+success_count+", total_count="+total+", %="+Math.round(success_count*100./total));
        var i;
        var na=document.querySelector("#na");
        na.addEventListener("click",function(e) {
            my_query.fields.website="Doesn't Exist";
            add_to_sheet();
        });
        var website=document.querySelector("crowd-input");
        website.addEventListener("paste", function(e) {
            e.preventDefault();
            let paste = (e.clipboardData || window.clipboardData).getData('text');
            my_query.fields.website=paste.replace(/https:\/\/[^\.]+\./,"https://www.")
        .replace(/\?.*$/,"").replace(/\#.*$/,"").replace(/\/$/,"");
            add_to_sheet();
        });

        var strong=document.querySelectorAll("crowd-form strong");
        var strong1=strong[0].innerText.trim(), strong2=strong[2].innerText.trim().split(/\s*,\s*/);
        for(i of strong2) {
            strong1=strong1.replace(i,"");
        }
        strong1=strong1.replace("LinkedIn","").trim();
        console.log("strong1="+strong1+",strong2="+strong2);
        my_query={name:MTP.removeDiacritics(strong2[0]),company:strong2[1],title:strong1,
                  fields:{"website":""},radios:{"choice-type":""}
                  ,done:{},
                  queried_on_url:false,
		  try_count:{"query":0},
		  submitted:false};
        my_query.name=my_query.name.replace(/^[A-Z]\.\s/,"");
        my_query.parsed_name=MTP.parse_name(my_query.name);
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.parsed_name.fname+" "+my_query.parsed_name.lname+" +\""+MTP.shorten_company_name(my_query.company)+"\" site:linkedin.com/in";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);
            let fail_count=GM_getValue("failCount",0);
            GM_setValue("failCount",fail_count+1);
            setTimeout(function() {
            GM_setValue("returnHit",true); },500);
        })
    }

})();