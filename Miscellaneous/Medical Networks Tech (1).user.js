// ==UserScript==
// @name         Medical Networks Tech
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/AggParser.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Nicknames.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=['.healthgrades.com','.vitals.com','.medicarelist.com','.healthcare4ppl.com','.yelp.com','.zocdoc.com',
                 '.npidb.com','/npino.com','.ehealthscores.com','/npiprofile.com','/healthprovidersdata.com','.usnews.com','.doximity.com',
                 '.linkedin.com','.sharecare.com','.caredash.com','.healthcare6.com','.topnpi.com','.webmd.com','.md.com','.yellowpages.com','researchgate.net',
                 '.corporationwiki.com','.medicinenet.com','.wellness.com','mturkcontent.com','/issuu.com','washingtonpost.com','.hrt.org','findatopdoc.com',
                  '.wiley.com','ratemds.com','.doctor.com','.youtube.com','.nlm.nih.gov','/pubprofile.com'];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A96C36HXWDNPB",false);
    var MTP=MTurkScript.prototype;

    function matches_nickname(desired_name,found_name) {
        if(found_name.toLowerCase()===desired_name.toLowerCase()) return true;
    }


    function is_bad_name(b_name,other_name,p_caption,i)
    {
        var temp_re=new RegExp("Dr\\. "+my_query.parsed_name.lname);
         var temp_re2=new RegExp(my_query.parsed_name.fname+" [A-Z]([a-z]+)?(\\.)? "+my_query.parsed_name.lname);
        console.log("temp_re2="+temp_re2);
        if(temp_re.test(p_caption) || temp_re2.test(p_caption) || new RegExp(my_query.short_name).test(p_caption)) return false;
        return true;
    }
    /**
     * Extract the title from b_name */
    function extract_title_b_name(b_name) {
        b_name=b_name.replace(/^Home\s*[\|\-,]/,"");
        let name2=b_name.replace(/,.*$/,"");
        let split=name2.split(/\s+[\|\-]\s+/);
        console.log("split="+JSON.stringify(split));
        return split[0];
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type);
        var search, b_algo, i=0, inner_a;
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
            if(type==='location' && parsed_context.Title && ((parsed_context.url && MTP.get_domain_only(parsed_context.url,true)===my_query.domain)
                                                                                   ||parsed_context.Address||
                                                            (parsed_context.SubTitle && /University|Medical|Organization/i.test(parsed_context.SubTitle)||parsed_context.Headquarters)
                                                            )
                                                                                   ) {
                parsed_context.Title=parsed_context.Title.replace(/:.*\sMD.*$/,"");
                resolve(parsed_context.Title);
                return;
            }


            if(type==='query'&& my_query.try_count[type]===0 && parsed_context.thing!==undefined&&parsed_context.thing.Clinic!==undefined) {
                my_query.fields['Q2Url']=parsed_context.thing.Clinic;
                query_search(my_query.short_name+" "+parsed_context.thing.Clinic+" ", resolve, reject, query_response,"clinic_query");
                return;
            }
            else if(type==='query' && my_query.try_count[type]===0 &&parsed_context.SubTitle==='Rheumatologist') {
                my_query.fields['Q2Url']=parsed_context.Title;
                query_search(my_query.short_name+" "+parsed_context.Title+" ", resolve, reject, query_response,"clinic_query");
                return;
            }
            else if(type==='query' && parsed_context.url) {
                resolve({url:parsed_context.url});
                    return;
            }
                console.log("parsed_context="+JSON.stringify(parsed_context)); } 

            if(type==='location' && lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
                 resolve(parsed_lgb.name.replace(/:.*\sMD.*$/,""));
                return;
                }


            for(i=0; i < b_algo.length&&i<8; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(type==="query" && !MTurkScript.prototype.is_bad_url(b_url, bad_urls,-1) &&
                   (!MTurkScript.prototype.is_bad_name(b_name,my_query.short_name,p_caption,i)||
                   !is_bad_name(b_name,my_query.short_name,p_caption,i))
		   && (b1_success=true)) break;
                if(type==='location' && my_query.try_count[type]===0 && i===0 && MTP.get_domain_only(b_url,true)===my_query.domain) {
                    my_query.try_count[type]+=1;
                    query_search(extract_title_b_name(b_name)+" "+my_query.specialty, resolve, reject, query_response,"location");
                    return;
                }

                if(i>2 && type==='query' && lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
                    if(parsed_lgb.url && !MTurkScript.prototype.is_bad_url(parsed_lgb.url, bad_urls,-1)) {
                        resolve({url:parsed_lgb.url});
                        return;
                    }
                }
                if(type==='query' && my_query.try_count[type]>0 && i>3) break;
            }
            if(b1_success && (resolve({url:b_url,name:b_name,caption:p_caption})||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
	do_next_query(resolve,reject,type);

        return;
    }
    function do_next_query(resolve,reject,type) {
        if(type==='query' && my_query.try_count[type]===0 ) {
            my_query.try_count[type]++;
            query_search(my_query.short_name+" "+my_query.specialty+" ", resolve, reject, query_response,"query");
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

    function other_title_match(name,caption) {
        var re1=/is an? ((?:[A-Z][a-z]+\s)+(?:\s*of (?:[A-Z][a-z]+(\s|$|,))+))/;
                var re=/(?:Clinical\s+)?(?:Assistant|Associate)?(?:\s+Clinical)? Professor(?: of (?:[A-Z][a-z]+(\s|$|,))+)?/,match;

        var re2=/(?:[A-Z][a-z]+\s)*Director/;
        var re3=/((?:chairman|chairperson) of (?:.*)) at/;
         if((match=caption.match(re1))||(match=name.match(re1))) {
             console.log("re1,match="+JSON.stringify(match));
             return match[1].trim();
         }
        if((match=caption.match(re))||(match=name.match(re))) return match[0].trim();
        if((match=caption.match(re2))) return match[0].trim();
        if((match=caption.match(re3))) return match[1].trim();


        return "";
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        my_query.fields.Q1Url=result.url.replace(/\?utm_source\=.*$/,"");
        var match;
        if(result.name&&result.caption && (match=other_title_match(result.name,result.caption))) my_query.fields.Q3Url=match;
        my_query.done.query=true;
        var domain=MTP.get_domain_only(result.url,true);
        my_query.domain=domain;
        add_to_sheet();
        var state=reverse_state_map[my_query.state]!==undefined?reverse_state_map[my_query.state]:""
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(domain+" "+state, resolve, reject, query_response,"location");
        });
        queryPromise.then(location_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });


    }

    function location_promise_then(result) {
        my_query.fields.Q2Url=result;
        my_query.done.location=true;
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
        for(x in my_query.fields) {
            if((MTurk.is_crowd && (field=document.getElementsByName(x)[0])) ||
               (!MTurk.is_crowd && (field=document.getElementById(x)))) field.value=my_query.fields[x];
        }
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }

    function init_Query()
    {
        console.log("in init_query");
        var p=document.querySelectorAll("form p");
        var colon_re=/^[^:]*:\s*/;
        my_query={name:p[0].innerText.trim().replace(colon_re,''),
                  specialty:p[1].innerText.trim().replace(colon_re,''),
                  state:p.length>2?p[2].innerText.trim().replace(colon_re,''):"",
                  
                  fields:{Q1Url:'',Q2Url:'',Q3Url:''},done:{},
		  try_count:{"query":0,"location":0},
		  submitted:false};
        my_query.short_name=my_query.name.replace(/,.*$/,"");
        my_query.parsed_name=MTP.parse_name(my_query.short_name)

	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.short_name+" "+my_query.specialty+" ";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.parsed_name.fname+" "+my_query.parsed_name.mname+ " \""+my_query.parsed_name.lname+
                         "\" " +my_query.specialty+" "+(state_map[my_query.state]!=undefined?state_map[my_query.state]:""), resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }

})();