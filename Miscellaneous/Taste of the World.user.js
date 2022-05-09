// ==UserScript==
// @name         Taste of the World
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=["tripadvisor.","/restaurantguru.com",".opentable.com","/foodeist.com/",".groupon.com","restaurants.com",".squaremeal.co.uk"];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(60000,1750+(Math.random()*1500),[],begin_script,"A2EILHT073BDZZ",false);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

    function query_google_response(response, resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var ab=doc.querySelector(".ab_button");
        if(ab && /Website/i.test(ab.innerText)) {
            my_query.url=ab.href;
            console.log("my_query.url=",my_query.url);
        }
        console.log("in query_google_response\n"+response.finalUrl+", type="+type);
        var ei_el=doc.querySelector("input[name='ei']");
        var ei=ei_el.value;
        var thumb=doc.querySelector(".thumb a");
        if(!thumb) {
             document.querySelectorAll('[name="asearchengineresearch"]')[2].click();
            my_query.bad_count++;
            resolve("");
            return;
        }
        var feat=thumb.href.replace(/.*uv\?pb\=\!1s/,"").replace(/\!3m.*$/,"");



        var new_url_begin='https://www.google.com/async/reviewDialog?ei='+encodeURIComponent(ei);
        new_url_begin+='&yv=3&async=feature_id:'+encodeURIComponent(feat);
        new_url_begin+=',review_source:All%20reviews,sort_by:newestFirst,is_owner:false,filter_text:,associated_topic:,next_page_token:,async_id_prefix:,_pms:s,_fmt:pc';
        var promise=MTP.create_promise(new_url_begin,parse_google_reviews,resolve,reject,{feat:feat});
    }
    function parse_google_reviews(doc,url,resolve,reject,response) {
        console.log("parse_google_reviews, url=",url,"doc=",doc);
        try {
            var sort=doc.querySelector("#reviewSort");
            var ved_el=doc.querySelector("[data-sort-id='newestFirst']");
            var new_url="https://www.google.com/async/reviewSort?vet=1"+sort.dataset.ved+'..i&ved='+ved_el.dataset.ved;
            new_url+='&yv=3&async=feature_id:'+encodeURIComponent(response.feat);
            new_url+=',review_source:All%20reviews,sort_by:qualityScore,is_owner:false,filter_text:,associated_topic:,next_page_token:,async_id_prefix:,_pms:s,_fmt:pc';
            console.log("new_url=",new_url);

            var last_time=doc.querySelector('.dehysf');

            var last_split=last_time.innerText.trim().replace(/a /,"1 ").split(" ");
            if(!/year/.test(last_split[1]) && (!/month/.test(last_split[1]) || parseInt(last_split[0])<=6)) {
                document.querySelectorAll('[name="asearchengineresearch"]')[0].click();
                my_query.fields.blatest_review=last_time.innerText.trim();
                add_to_sheet();
            }
            else {
                document.querySelectorAll('[name="asearchengineresearch"]')[1].click();
                my_query.fields.curl_detailsverifyclosure=last_time.innerText.trim();
                my_query.bad_count++;

                add_to_sheet();
            }
            resolve("");
            return;
        }
        catch(e) {
             document.querySelectorAll('[name="asearchengineresearch"]')[1].click();
                my_query.bad_count++;
              resolve("");
            return;
        }


      /*  setTimeout(function() {
                var promise=MTP.create_promise(new_url,parse_google_reviews_sorted,resolve,reject);
        }, 500);*/
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
                if(type==="q2" && parsed_context.url&&!MTP.is_bad_url(parsed_context.url,bad_urls,4,2)) {
                    resolve(parsed_context.url);
                    return;
                }
                else if(parsed_context.url && !MTP.is_bad_url(parsed_context.url,bad_urls,4,2)) {
                    my_query.url=parsed_context.url;
                }
                if(type==="q2" && parsed_context.Facebook) {
                    my_query.Facebook=parsed_context.Facebook;
                    var promise=MTP.create_promise(my_query.Facebook,parse_FB,parse_FB_then,function() { my_query.done.facebook=true; submit_if_done(); });
                }
                else {
                    my_query.done.facebook=true;
                }

            }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); 
				if(type==="q2" && parsed_lgb.url&&!MTP.is_bad_url(parsed_lgb.url,bad_urls,-1)) {
                resolve(parsed_lgb.url);
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
                if(type==="tripadvisor" && !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i)
		   && (b1_success=true)) break;
                 if(type==="q2" && !MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i)
		   && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(my_query.url) { resolve(my_query.url); return; }
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
    function query_google_search(search_str, resolve,reject, callback,type,filters) {
        console.log("Searching with google for "+search_str);
        if(!filters) filters="";
        var search_URIGoogle='https://www.google.com/search?q='+
            encodeURIComponent(search_str);
        GM_xmlhttpRequest({method: 'GET', url: search_URIGoogle,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        console.log("result=",result);
        my_query.done.query=true;
        submit_if_done();
    }

     function q2_promise_then(result) {
        console.log("result=",result);
         if(!my_query.url)         my_query.url=result;
         var promise=MTP.create_promise(my_query.url,parse_website,parse_website_then,parse_website_fail);

    }

    function parse_FB(doc,url,resolve,reject) {
       // console.log("parse_FB, doc=",doc.body.innerHTML);
        resolve("");
    }
    function parse_FB_then() {
        my_query.done.facebook=true;
        submit_if_done();
    }
    function parse_website(doc,url,resolve,reject) {
        console.log("parse_website,doc=",doc.body.innerHTML.length," url=",url);
        if(doc.body.innerHTML.length>1000&&!MTP.is_bad_page(doc,url)&&!is_bad_page2(doc,url)) resolve("");
        else reject("");
    }
    function is_bad_page2(doc,url) {
        var bob=doc.body.innerHTML.match(/Hello world\!/);
        console.log("doc=",doc);
        if(/https?:\/\/ww\d/.test(url)) return true;
        if(bob) return true;
        return false;
    }
    function parse_website_then() {
        document.querySelectorAll('[name="dofficialsite"]')[0].click();
        my_query.fields.eurl_detailsactive=my_query.url;
        my_query.done.q2=true;
        submit_if_done();
    }
    function parse_website_fail() {
        document.querySelectorAll('[name="dofficialsite"]')[2].click();
                    my_query.bad_count++;

     //   my_query.fields.eurl_detailsactive=my_query.url;
        my_query.done.q2=true;
        submit_if_done();
    }
    function tripadvisor_promise_then(result) {
        console.log("result=",result);
        my_query.tripadvisor_url=result;
        var promise=MTP.create_promise(result,parse_trip_advisor,parse_trip_advisor_then,function() { GM_setValue("returnHit",true); });


    }


    function parse_trip_advisor(doc,url,resolve,reject) {
        var scripts=doc.scripts;
        var s;
        var my_re=/ta\.uid \= \'([^\']*)\'/,match;
        let new_href=doc.querySelector("a[data-page-number='1']");
        if(!new_href) { parse_trip_advisor2(doc,url,resolve,reject); return; }
        var new_url=MTP.fix_remote_url(new_href.href,url);
        console.log("new_url=",new_url);
        var promise=MTP.create_promise(new_url,parse_trip_advisor2,resolve,reject);
        /* GM_xmlhttpRequest({method: 'POST', url: url,headers:headers,
                            data:data,
                           onload: function(response) { parse_trip_advisor2(response, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });*/
        return;




    }

    function parse_trip_advisor2(doc,url, resolve, reject)
    {
      /*  var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
*/
        console.log("parse_tripadvisor2, url=",url,"doc=",doc);

         var rating=doc.querySelector(".ratingDate");
        if(!rating) {
            document.querySelectorAll("[name='gmedia']")[1].click();
            my_query.fields.iurl_detailsclosure=url;
            my_query.bad_count++;
            resolve("");
            return;
        }
        console.log("rating=",rating);
        var reviewDate=Date.parse(rating.title);
        var y=(Date.now()-reviewDate)/(86400*1000)
        if(y<=180) {
            document.querySelectorAll("[name='gmedia']")[0].click();
            my_query.fields.hlatest_reviewthirdparty=rating.title;
        }
       else {
            document.querySelectorAll("[name='gmedia']")[1].click();
            my_query.fields.iurl_detailsclosure=url;
                       my_query.bad_count++;

        }
        resolve("");
    }

    function parse_trip_advisor_then(result) {
        my_query.done.tripadvisor=true;
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
            if((field=document.getElementsByName(x)[0])) field.value=my_query.fields[x];
        }
        try {
            console.log("my_query.bad_count=",my_query.bad_count);
            if(my_query.bad_count<3) {
                document.querySelectorAll("[name='jdecision']")[1].click();
            }
            else {
                document.querySelectorAll("[name='jdecision']")[0].click();
            }
        }
        catch(e) {
            console.log("error with jdecision");
        }



    }

    function submit_if_done() {
        var is_done=true,x,is_done_dones=x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        for(x in my_query.fields) if(!my_query.fields[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.bad_count===1 || my_query.bad_count===2)) {
            console.log("2 bad, returning");
            GM_setValue("returnHit",true);
            return;
        }
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
        var car=document.querySelectorAll(".carousel,ul,.collapsible,h4,br");
        var c;
        for(c of car) {
            c.parentNode.removeChild(c);
        }

       var name=document.querySelector("#name");
        my_query={name:document.querySelector("#name").innerText.trim(),
                  street:document.querySelector("#street").innerText.trim(),
                  city:document.querySelector("#city").innerText.trim(),
                  postalcode:document.querySelector("#postalcode").innerText.trim(),
                  phone:document.querySelector("#phone").innerText.trim(),

                  fields:{},done:{query:false,tripadvisor:false,q2:false,facebook:false},
                  bad_count:0,
		  try_count:{"query":0},
		  submitted:false};
        my_query.city=my_query.city.replace(/United States,\s*/,"");
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+" "+my_query.street+" "+my_query.city;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_google_search(search_str, resolve, reject, query_google_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
        setTimeout(function() {
         const q2Promise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"q2");
        });
        q2Promise.then(q2_promise_then)
            .catch(function(val) {
            console.log("Failed at this query2Promise " + val);  document.querySelectorAll('[name="dofficialsite"]')[2].click();
                    my_query.bad_count++;

     //   my_query.fields.eurl_detailsactive=my_query.url;
        my_query.done.q2=true;
        submit_if_done();
        });
         const taPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" site:tripadvisor.com", resolve, reject, query_response,"tripadvisor");
        });
        taPromise.then(tripadvisor_promise_then)
            .catch(function(val) {
            console.log("Failed at this query2Promise " + val); GM_setValue("returnHit",true); }); }, 2000);
    }

})();