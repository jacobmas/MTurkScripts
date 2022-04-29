// ==UserScript==
// @name         Faqx
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Sheriff
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://*.facebook.com/*
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=["policelocator.com"];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A24LSUOSFLI19G",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

        if(/\.facebook\.com/.test(window.location.href)) {
        GM_addValueChangeListener("facebook",function() {
            console.log("arguments=",arguments);
            window.location.href=arguments[2].url;
        });

        setTimeout(parse_FB,2500);

    }

    function parse_FB() {
        console.log("parse FB");
        var result={};
        result.address=document.querySelector("a[href*='google.com']")?document.querySelector("a[href*='google.com']").innerText.trim():"";

        var good_fields=document.querySelectorAll(".rq0escxv.l9j0dhe7.du4w35lb.j83agx80.cbu4d94t.d2edcug0.hpfvmrgz.rj1gh0hx.buofh1pr.g5gj957u.o8rfisnq.p8fzw8mz.pcp91wgn.iuny7tx3.ipjc6fyt");
        var curr_field;
        for(curr_field of good_fields) {
            if(/Follow This/i.test(curr_field.innerText)) {
                        result.followers=curr_field.innerText.trim().replace(/^([\d,]*).*$/,"$1").replace(/,/g,"");
            }
            if(phone_re.test(curr_field.innerText)) {
                result.phone=curr_field.innerText.trim();
            }

        }

        var url=document.querySelector(".o8rfisnq span.py34i1dx > a[href*='.php']")?document.querySelector(".o8rfisnq span.py34i1dx > a[href*='.php']"):"";
        result.url=url?url.href:"";
        result.url=decodeURIComponent(result.url.replace("https://l.facebook.com/l.php?u=","")).replace(/\?fbclid\=.*$/,"");
        console.log("result=",result);
        result.date=Date.now();
        GM_setValue("result",result);

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
			b_algo=doc.querySelectorAll("#b_results > .b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context)); 
				   if(parsed_context.Phone&&!my_query.fields.phone_general) {
                let phone=parsed_context.Phone.replace(/[^\d]+/g,"");
                my_query.fields.phone_general=phone.substring(0,3)+"-"+phone.substring(3,6)+"-"+phone.substring(6,10);
                add_to_sheet();
            }
            if(type==="query") {
            //    if(parsed_context.Facebook) my_query.fields.url_facebook=parsed_context.Facebook;
            //    if(parsed_context.Twitter) my_query.fields.url_twitter=parsed_context.Twitter;
            }
                if(parsed_context.url&&!MTP.is_bad_url(parsed_context.url,bad_urls,-1)) {
                    if(type==="query") my_query.fields.url_web=parsed_context.url;
                    add_to_sheet();
                    if(type==="query") {
                        resolve(parsed_context.url);
                        return;
                    }
                }

				} 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); 
					if(parsed_lgb.url&&!MTP.is_bad_url(parsed_lgb.url,bad_urls,-1)) {
               // resolve(parsed_lgb.url);
                return;
            }
					
					}
            for(i=0; i < b_algo.length&&i<2; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(type==="query"
		   && (b1_success=true)) break;
                if(type=="fb" && !MTP.is_bad_fb(b_url) && !MTurkScript.prototype.is_bad_name(b_name.replace(/\s-.*$/,""),my_query.name,p_caption,i)
		   && (b1_success=true)) break;
                 if(type=="twitter" && /twitter\.com/.test(b_url) && !MTP.is_bad_twitter(b_url) && !MTurkScript.prototype.is_bad_name(b_name.replace(/\s-.*$/,""),my_query.name,p_caption,i)
		   && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
	do_next_query(resolve,reject,type);
        return;
    }
    function do_next_query(resolve,reject,type) {
        if(type==="twitter" && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            query_search(my_query.name+" sheriff twitter", resolve, reject, query_response,"twitter");
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
        my_query.fields.url_web=result;
        console.log("query_promise_then,result=",result);
        my_query.done.query=true;

        submit_if_done();
    }

    function fb_promise_then(result) {
        my_query.fields.url_facebook=result;
        my_query.done.fb=true;
        submit_if_done();
    }

    function twitter_promise_then(result) {
        my_query.fields.url_twitter=result;
        my_query.done.twitter=true;
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
        var is_done=true,x,is_done_dones=x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        for(x in my_query.fields) if(!my_query.fields[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones && !my_query.submitted) {
            console.log("Failed to find all fields");
            GM_setValue("returnHit",true);
        }
    }

    function init_Query()
    {
		bad_urls=bad_urls.concat(default_bad_urls);
        console.log("in init_query");
        var i;
        var mark=document.querySelector("mark");
        my_query={name:mark.innerText.trim(),fields:{url_facebook:"",url_web:"",phone_general:""},done:{query:false,fb:false},
		  try_count:{"query":0,"fb":0,"twitter":0},
		  submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+" parks and recreation ";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.query=true; submit_if_done(); });
        search_str=my_query.name+" parks and recreation site:facebook.com";
        const fbPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"fb");
        });
       fbPromise.then(fb_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.fb=true; submit_if_done(); });
                search_str=my_query.name+" sheriff site:twitter.com";

        
    }

})();