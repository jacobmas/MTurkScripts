// ==UserScript==
// @name         Ryan
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Find Job Title, company, url given name, location
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
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/e62491366621013aefff1da82b5adcf826ffce3c/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,750+(Math.random()*750),[],begin_script,"A31GKIY94L2UUU",false);
    var MTP=MTurkScript.prototype;

    var domain_map={"bizapedia.com/people":"parse_bizapedia"};
    function is_bad_name(b_name)
    {
        return false;
    }
    function query_response_loop(b_name,b_url,p_caption,type,promise_list,i) {
        var short_name=b_name.replace(/\s[\-\|\,]+.*$/,"").replace(/,.*$/,"").trim();
        var full_short=MTP.parse_name(short_name);
        var match;
        console.log("# short_name="+short_name+", my_query.name="+my_query.name);
        if(short_name.indexOf(my_query.fullname.lname)!==-1) {
            var first=short_name.replace(/\s.*$/,"");
            if(first.substr(0,2)===my_query.fullname.fname.substr(0,2)) {
                if(!my_query.synonyms.includes(first)) {
                my_query.synonyms.push(first);  }
            }
        }
        if((/query/.test(type)) && /linkedin\.com\/in/.test(b_url) && full_short.fname===my_query.fullname.fname &&
           full_short.lname===my_query.fullname.lname) {
            match=b_name.match(/^(.*?)\s+-\s+(.*?)\s+-\s+(.*?)\s+(?:[\|\-]|(?:\.\.\.))/);
            if(match) {
                Object.assign(my_query.fields,{url:b_url,title:match[2].trim(),company:match[3].trim()});
                return true;

            }
        }
        if((type==="query"||(type==="temp_query")) && /linkedin\.com\/in/.test(b_url) &&
           ((full_short.fname===my_query.fullname.fname &&
             full_short.lname.indexOf(my_query.fullname.lname)!==-1) ||
            (b_url.indexOf(my_query.fullname.fname.toLowerCase())!==-1 && b_url.indexOf(my_query.fullname.lname.toLowerCase())!==-1)
                                                               ) && !my_query.redone_linkedin) {
            console.log("MATCHED short_name, my_query.name for linkedin");
            my_query.redone_linkedin=true;

            var search_str=//my_query.name+" "+b_url.replace(/https?:\/\/[^\/]*\/in\//,"");
                b_name.replace(/[\-\|\,]*\s*LinkedIn\s*$/i,"").replace(/\.\.\.\s*$/,"");
            if(search_str.replace(/^[^\-]*\s-\s*/,"").indexOf("linkedin")!==-1 && !my_query.temp_redo) {
                my_query.temp_redo=true;
                my_query.redone_linkedin=false;
                search_str="\""+my_query.name+"\" "+b_url.replace(/https?:\/\/[^\/]*\/in\//,"");
            }
            const redonequeryPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search with "+search_str);
                query_search(search_str, resolve, reject, query_response,"temp_query");
            });
            redonequeryPromise.then(query_promise_then)
                .catch(function(val) {
                console.log("Failed at this queryPromise " + val); my_query.done.redone_query=true;
            submit_if_done(); });
            if(my_query.temp_redo && !my_query.redone_linkedin) return true;
        }

        if(/bloomberg\.com\/profiles\/people/.test(b_url)) {
            console.log("BLOOM: "+b_url);
            let bloom_reg=new RegExp(my_query.name+"\\sis\\s+(.*?) at ([^\\.]*)");
            if((match=p_caption.match(bloom_reg))) {
                my_query.fields.url=b_url;
                my_query.fields.title=match[1].trim();
                my_query.fields.company=match[2].trim();
                return true;

            }
        }
        if(/corporationwiki\.com/.test(b_url)&& full_short.fname===my_query.fullname.fname &&
           full_short.lname===my_query.fullname.lname) {
            var split=b_name.split(/\s+-\s+/);
            if(split.length>=2 && (match=split[1].match(/^(.*?) for (.*)$/))) {
                my_query.fields.url=b_url;
                my_query.fields.title=match[1].trim();
                my_query.fields.company=match[2].trim();
                return true;

            }
        }
        if(/bizapedia\.com/.test(b_url)) {
            var bizapedia_re=new RegExp(my_query.fullname.lname+" is listed as a(?:n)? (.*?) with (.*)? in "+my_query.state);
            if((match=p_caption.match(bizapedia_re))) {
                Object.assign(my_query.fields,{url:b_url,title:match[1].trim(),company:match[2].trim()});
                return true;
            }
        }
        if(i<2 && /\.mylife\.com/.test(b_url)) {
            var mylife_re=new RegExp("(?:(?:For work these days,\\s+"+my_query.fullname.fname+" is a(?:n)? )|(?: occupation is listed as a(?:n)? ))"+
                                     "(.*?) at ([^\\.]*)");
            if((match=p_caption.match(mylife_re))) {
                my_query.fields.url=b_url;
                my_query.fields.title=match[1].trim();
                my_query.fields.company=match[2].trim();
                return true;
            }
        }
        if(/zoominfo\.com/.test(b_url)&& full_short.fname===my_query.fullname.fname &&
           full_short.lname===my_query.fullname.lname) {
            var zoom_re=/business profile as (.*?) at (.*?) and/;
            if((match=p_caption.match(zoom_re))) {
                Object.assign(my_query.fields,{url:b_url,title:match[1].trim(),company:match[2].trim()});
                return true;

            }
        }
        if(/psychologytoday\.com/.test(b_url) ) {
            console.log("! full_short="+JSON.stringify(full_short));
            let split=b_name.split(",");
            if(split.length>=2) {
                Object.assign(my_query.fields,{url:b_url,title:split[1].trim(),company:"Self-Employed"});
                return false;
            }
        }



        var p_caption_regex=new RegExp("^"+my_query.name+" ((?:[A-Z][a-z]+\\s)+)at ([^\\.]{5,100})");
        if((match=p_caption.match(p_caption_regex))) {
            my_query.fields.url=b_url;
            my_query.fields.title=match[1].trim();
            my_query.fields.company=match[2].trim();
            return true;
        }
        return false;

    }
    function fix_location(location) {
        location=location.replace(/(Greater Los Angeles Area)$/i,"$1, California");
        return location;
    }
    function found_good_person(people,resolve,reject,type) {
        let curr_person;
        for(curr_person of people) {
            //console.log("state_map[my_query.state]="+state_map[my_query.state]);
            curr_person.name=curr_person.name.replace(/,.*$/,"");
            let full=MTP.parse_name(curr_person.name.trim());
            //console.log("@ full.lname="+full.lname+", my_query.fullname.lname="+my_query.fullname.lname);
            if(full.lname.indexOf(my_query.fullname.lname)===-1) continue;
            if(/United Kingdom|, Canada/.test(curr_person.location)) continue;
            curr_person.location=fix_location(curr_person.location);
            //console.log("curr_person.location="+curr_person.location);
            if(people.length<2 || curr_person.location.length===0 ||
               curr_person.location.indexOf(my_query.state)!==-1 || curr_person.location.indexOf(state_map[my_query.state])!==-1 ||
               curr_person.location.indexOf(my_query.city)!==-1) {
                //console.log("# Creating promise for "+curr_person.url);
                let x;
                var is_bad=false;
                for(x in state_map) {
                    //console.log("x="+x);
                    if(x!==my_query.state && new RegExp(",\\s*"+x).test(curr_person.location)) is_bad=true;
                }
                if(is_bad) continue;

                var promise=MTP.create_promise(curr_person.url,query_response,resolve,reject,type);
                return true;
            }
        }
        return false;
    }

    function query_response(doc,url,resolve,reject,type) {
       
        console.log("in query_response\n"+url+", type="+type);
        var search, b_algo, i=0, inner_a;
        var promise_list=[],match;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
            if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
                if(parsed_context.people) {
                    if(found_good_person(parsed_context.people,resolve,reject,type)) return;
                }
                if(parsed_context.person &&
                   ((parsed_context.person.experience&&parsed_context.person.experience.length>0)||parsed_context.person.Current)) {
                    var person=parsed_context.person;
                    my_query.fields.url=person.linkedin_url;
                    if(parsed_context.person.experience&&parsed_context.person.experience.length>0) {

                        my_query.fields.title=person.experience[0].title;
                        my_query.fields.company=person.experience[0].company;
                    }
                    else {
                        let split=person.Current.split(/,\s*/);
                        my_query.fields.title=split[0];
                        if(split.length>1) my_query.fields.company=split[1];
                        else {
                            match=person.Current.match(/^(.*?) at (.*)$/);
                            if(match) {
                                my_query.fields.title=match[1];
                                my_query.fields.company=match[2];
                            }
                        }
                    }
                    var fullname=MTP.parse_name(person.name);
                    if(fullname.fname.charAt(0)===my_query.fullname.fname.charAt(0) ||
                       MTP.longest_common_subsequence(my_query.fullname.fname,fullname.fname).length>=2) {

                       resolve("");
                        return;
                    }
                    else {
                        my_query.fields.title=my_query.fields.company=my_query.fields.url="";
                    }
                }
                if(parsed_context.Clinic && parsed_context.SubTitle) {
                    Object.assign(my_query.fields,{title:parsed_context.SubTitle,url:url,company:parsed_context.Clinic});
                    resolve("");
                    return;
                }
            }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<7; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);

                b1_success=query_response_loop(b_name,b_url,p_caption,type,promise_list,i);
                if(b1_success) break;
                //if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !is_bad_name(b_name) && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        var search_str;
        if(type==="query" && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            search_str=my_query.name+" "+my_query.state+" linkedin";
            query_search(search_str, resolve, reject, query_response,"query");
            return;
        }
        if(type==="query" && my_query.try_count[type]===1) {
            my_query.try_count[type]++;
            search_str="\""+my_query.name+"\" "+my_query.state+" site:linkedin.com";
            query_search(search_str, resolve, reject, query_response,"query");
            return;
        }
        if(type==="query" && my_query.try_count[type]===2&&my_query.synonym_pos<my_query.synonyms.length) {
            search_str=my_query.synonyms[my_query.synonym_pos]+" "+my_query.fullname.lname+" "+my_query.state+" linkedin";
            my_query.synonym_pos++;
            query_search(search_str, resolve, reject, query_response,"query");
            return;
        }
        reject("Nothing found");
        return;
    }

    var parse_bizapedia=function(doc,url,resolve,reject) {
        console.log("in parse_bizapedia, url="+url);
        var biz=doc.querySelector("[itemtype='https://schema.org/LocalBusiness']");
        var result={success:true,site:"bizapedia",fields:{}};
        if((!biz) && (resolve(result)||true)) return;
        var td=biz.querySelectorAll("td"),i,nextItem,x;
        for(i=0;i<td.length;i++) {
            if(/^(Principal|Mailing)/.test(td[i].innerText)) {
                console.log("### Found principal address");
                nextItem=td[i].parentNode.querySelectorAll("td")[1];
                result.address=AggParser.parse_postal_elem(nextItem,4,"bizapedia");
                break;
            }
        }
        resolve(result);

    };

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) {
var doc = new DOMParser()
.parseFromString(response.responseText, "text/html");
                               callback(doc,response.finalUrl, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        my_query.done.query=true;
        my_query.done.redone_query=true;
        console.log("query_promise_then, my_query.fields="+JSON.stringify(my_query.fields));
        if(/^[\-a-z&]*$/.test(my_query.fields.company)) {
            my_query.fields.company=my_query.fields.company.replace(/([a-z\&]+)(\-|$)/g,function(match,p1,p2) {
                var last="";
                if(p2 && p2.length>0) last=" ";
                return p1.charAt(0).toUpperCase()+p1.substr(1)+last;
            });
        }
        var city_reg=new RegExp(my_query.city+",.*$");
        my_query.fields.company=my_query.fields.company.replace(city_reg,"").replace(/\s*\.\.\..*$/,"");
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
        var x,field;
        var field_name_map={"title":"firstName","company":"lastName","url":"contactInfoPage"};

        for(x in my_query.fields) {
            if((field=document.getElementsByName(field_name_map[x]))) field[0].value=my_query.fields[x];
        }
    }

    function submit_if_done() {
        var is_done=true,x;
        console.log("my_query.done="+JSON.stringify(my_query.done));

        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) {
            if(my_query.fields.title.length>0) MTurk.check_and_submit();
            else {

                setTimeout(function() { GM_setValue("returnHit"+MTurk.assignment_id,true); }, 1000);
            }
        }
    }

    function init_Query() {
        console.log("in init_query");
        var i;
        var h3=document.querySelectorAll("#mturk_form h3");
        var place_re=/^[^:]*:\s*([^,]*),\s*(.*)$/,match;


        my_query={name:"",city:"",state:"",fields:{title:"",company:"",url:""},synonyms:[],synonym_pos:0,
                  done:{query:false,redone_query:false},submitted:false,redone_linkedin:false,
                 try_count:{"query":0}};

	console.log("my_query="+JSON.stringify(my_query));
        my_query.name=h3[1].innerText.replace(/^[^:]*:\s*/,"").trim();
        my_query.name=my_query.name.replace(/([A-Z]{2,}[^\s]*)(\s|$)/g,function(match,p1,p2) {
            return p1.charAt(0)+p1.substr(1).toLowerCase()+p2; });
        my_query.name=my_query.name.replace(/(^|\s)([a-z][^\s]*)/g,function(match,p1,p2) {
            return p1+p2.charAt(0).toUpperCase()+p2.substr(1).toLowerCase(); });

        my_query.fullname=MTP.parse_name(my_query.name);
        if((match=h3[2].innerText.match(place_re))) {
            my_query.city=match[1];
            my_query.state=match[2];
        }
        var search_str=my_query.name+" "+my_query.city+" "+my_query.state+" ";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" linkedin", resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.query=true;
            if(!my_query.redone_linkedin) my_query.done.redone_query=true;
        submit_if_done(); });

       const medPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" site:webmd.com", resolve, reject, query_response,"med");
        });
        medPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.bloomberg=true;
        });
    }

})();