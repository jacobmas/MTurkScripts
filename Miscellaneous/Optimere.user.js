// ==UserScript==
// @name         Optimere
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
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
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"ARQR2FMQPUSFL",false);
    var MTP=MTurkScript.prototype;

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

    function is_bad_name(b_name)
    {
        return false;
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
                var facts=b_context.querySelectorAll(".l_ecrd_qfcts_fct");
                let fact;
                for(fact of facts) {
                    let fact_key=fact.querySelector(".l_ecrd_txt_ttl");
                    let fact_val=fact.querySelector(".l_ecrd_qfcts_prim");
                    if(fact_key && fact_val) {
                        parsed_context[fact_key.innerText.trim()]=fact_val.innerText.trim();
                    }


                }
                                console.log("parsed_context="+JSON.stringify(parsed_context));

                if(parsed_context.Address) {
                    my_query.parsed_address=new Address(parsed_context.Address);
                }

               /* if(type==="fb" && parsed_context.Facebook) {
                    resolve(parsed_context.Facebook);
                    return;
                }*/
                if(type==="query" && parsed_context.Population) {
                    my_query.fields["Population"]=parsed_context.Population.trim().replace(/\s.*$/,"").replace(/,/g,"");
                    resolve("");
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
                if(type==="fb" && !MTurkScript.prototype.is_bad_name(b_name.replace(/\s\-.*$/,""),my_query.name,p_caption,i)
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

    function query_promise_then() {
        my_query.done.query=true;
        submit_if_done();
    }
    /* Following the finding the district stuff */
    function fb_promise_then(result) {
        console.log("result=",result);
        my_query.fb_url=result;
        var new_url=MTP.find_FB_about_url(result);
        console.log("new_url=",new_url);

        GM_addValueChangeListener("result",function() {
           let my_result=arguments[2];
            my_query.done.fb=true;
            my_query.fields["Billing Street Address"]=my_result.address;
            if(my_result.address) my_query.parsed_address=new Address(my_result.address);
            my_query.fields["Phone Number"]=my_result.phone;
            my_query.fields["Website"]=my_result.url;
            my_query.fields["Facebook URL"]=my_query.fb_url;
            my_query.fields["Facebook Followers"]=my_result.followers;
                    var place_name="";
        if(my_query.parsed_address &&my_query.parsed_address.city && !/County/.test(my_query.name)) {
            place_name=my_query.parsed_address.city+", "+my_query.parsed_address.state;
            const queryPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search");
                query_search(place_name, resolve, reject, query_response,"query");
            });
            queryPromise.then(query_promise_then)
                .catch(function(val) {
                console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
        }
        else {
            console.log("No address or county, returning");
            GM_setValue("returnHit",true);
            return;
        }
            submit_if_done();
        });
        GM_setValue("facebook",{url:new_url,date:Date.now()});

    }

    function parse_fb_then(result) {
        console.log("parse_fb_then,result=",result);
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
        var wT=document.querySelector("form table");
        my_query={name:wT.rows[0].cells[1].innerText.trim(),fields:{Population:""},done:{query:false,fb:false},
		  try_count:{"query":0},
		  submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+" site:facebook.com";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"fb");
        });
        queryPromise.then(fb_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }

})();