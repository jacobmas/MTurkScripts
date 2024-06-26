// ==UserScript==
// @name         Taste_of_the_World_Geocode
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://*.google.com/*
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
// @grant window.close
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
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(40000,1500+(Math.random()*1000),[],begin_script,"A2EILHT073BDZZ",false);
    var MTP=MTurkScript.prototype;

    if(/\.google\.com/.test(window.location.href) && /maps/.test(window.location.href)) {
        console.log("On Google");
        setTimeout(parse_google_maps,1000,0);
    }

    function feet_to_meters(dist) {
        return dist/3.2808;
    }

    function parse_google_maps(ctr) {
        let item=document.querySelectorAll(".ivN21e.tUEI8e");
        if(item) {
            document.querySelector("[data-tooltip='Walking']").click();
            if(item.length>=1) { setTimeout(function() { parse_item(item[0]); }, 3000);
                               return; }
            else if(item.length>1) {
                            GM_setValue("result",{date:Date.now(),success:false});
           close_window();
                return;
            }


        }
        ctr++;
        if(ctr<16)
        {
            console.log("Waiting, ctr=",ctr);
            setTimeout(parse_google_maps, 500, ctr);
        }
        else {
            GM_setValue("result",{date:Date.now(),success:false});
            close_window();
        }
    }

    function close_window() {
       window.close();
    }

    function parse_item(item) {
        let result={date:Date.now(),success:false};
        let my_re=/([\d,\.]+) ([a-z]+)/;
        let match=item.innerText.trim().match(my_re);
        if(match) {
            let dist=parseFloat(match[1].replace(/,/g,""));
            result.metric=match[2];
            if(/ft/.test(match[2])) {
                result.dist=Math.round(feet_to_meters(dist));
                result.success=true;
                GM_setValue("result",result);
               close_window();
                return;
            }
            else if(match[2].trim()==='m') {
                result.dist=dist;
                result.success=true;
                GM_setValue("result",result);
               close_window();
                return;
            }
            else if(match[2]==='km') {
                 result.dist=dist*1000;
                result.success=true;
                GM_setValue("result",result);
               close_window();
                return;
            }
            else if(match[2]==="miles") {
                result.dist=Math.round(feet_to_meters(dist*5280.));
                result.success=true;
                GM_setValue("result",result);
               close_window();
                return;
            }
            else {
                result.dist=match[1];
                result.metric=match[2];
            }


        }
        GM_setValue("result",result);
               close_window();
        return;

    }
    function is_bad_name(b_name)
    {
        return false;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption, parsed_b_ans;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb, b_ans;
        try
        {
            search=doc.getElementById("b_content");
			b_algo=doc.querySelectorAll("#b_results > .b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            b_ans=doc.querySelector(".b_ans.b_top");

            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context)); 
				
				if(parsed_context.url&&!MTP.is_bad_url(parsed_context.url,bad_urls,-1)) {
                resolve(parsed_context.url);
                return;
            }
				} 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); 
					if(parsed_lgb.url&&!MTP.is_bad_url(parsed_lgb.url,bad_urls,-1)) {
                resolve(parsed_lgb.url);
                return;
            }
					
					}
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].querySelector("h2 a").href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i)
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
        var a=document.querySelector("form a");
        var p=document.querySelectorAll("address p");
        var item;
        for(item of p) {
            if(/Address/.test(item.innerText)) {
                my_query.address=item.innerText.replace(/^[^:]*:\s*/,"")
                GM_setValue("address",my_query.address);
            }
            if(/Name/.test(item.innerText)) {
                my_query.name=item.innerText.replace(/^[^:]*:\s*/,"")
            }
        }
        GM_addValueChangeListener("result",function() {
            let result=arguments[2];

                let radios=document.querySelectorAll("input[name='answer']");
            if(result.success) {
                console.log("Success, result=",result);
                if(result.dist<=25) {
                    radios[0].click();
                }
                else {
                    radios[1].click();
                }
                document.querySelector("[name='distance']").value=result.dist;
                submit_if_done();
                return;
            }
            else {
                console.warn("Failed, result=",result);
                GM_setValue("returnHit",true);
            }

        });
        let new_url=a.href+encodeURIComponent(my_query.name+","+my_query.address);
        console.log("new_url=",new_url);
        GM_openInTab(new_url);
    }

})();