// ==UserScript==
// @name         MelissaHalliburtonHotel
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
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A2JJ44DJW5FK4Q",true);
    var MTP=MTurkScript.prototype;
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
            try {
            var checkindate=doc.body.innerHTML.match(/&quot;checkindate&quot;:&quot;([^&]*)/);
            var checkoutdate=doc.body.innerHTML.match(/&quot;checkoutdate&quot;:&quot;([^&]*)/);

            var result=doc.body.innerHTML.match(/hotelAdsForm\.Resubmit\(([^\)]*)\)/);
           if(result&&my_query.try_count[type]===0) {
               console.log("result=",result);
               resolve({result:result,checkindate:checkindate,checkoutdate:checkoutdate});

                       return; }
            }
            catch(err) {
                console.log("err=",err);
            }

            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context)); 
				
				} 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); 
					
					}
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=MTP.fix_bing_link(b_algo[i].querySelector("h2 a").href);
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(/kayak\.com|(\/rebates\/welcome\?)/.test(b_url)) {
                    let temp=b_name.match(/(\$\d+)/);
                    if(temp) {my_query.fields.rate=temp[1];
                              resolve("");
                              return;
                             }
                }
                if(/(hotels|expedia)\.com/.test(b_url)) {
                    let temp=p_caption.match(/(\$\d+)/);
                    if(temp) { my_query.fields.rate=temp[1];
                    resolve("");
                    return; }
                }
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            console.log("Error=",error);
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
    function query_promise_then(obj) {
        console.log("obj=",obj);
        var result=obj.result;
        console.log("result=",result);
        console.log("checkin=",obj.checkindate, "checkout=",obj.checkoutdate);

        if(!obj.result || !obj.checkindate) {
            if(my_query.try_count.query===0) {
                my_query.try_count.query++;
                const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
                    query_search(my_query.name, resolve, reject, query_response,"query");        });
                 queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });

                return;
            }
            else {
                submit_if_done();
                return;
            }
        }
        var split=result[1].split(/,/);
        console.log("split=",split);
        var url="https://www.bing.com/local/hotelads?inDate="+obj.checkindate[1]+"&outDate="+obj.checkoutdate[1]+"&entityid="+split[2].replace(/\'/g,"").trim()+
            "&q="+split[3].replace(/\'/g,"").trim();

        var promise=MTP.create_promise(url,parse_prices,parse_prices_then,function() { GM_setValue("returnHit",true); });
        console.log("url=",url);

    }

    function parse_prices(doc,url,resolve,reject) {
        console.log("parse_prices,url=",url);
        //console.log("doc.body.innerHTML=",doc.body.innerHTML);
        var prices=doc.querySelectorAll(".hr_roomprice");
        if(prices.length===0 && my_query.try_count.prices===0) {
            my_query.try_count.prices++;
            url=url.replace(/inDate=([^&]*)/,"inDate=4/10/2023").replace(/outDate=([^&]*)/,"outDate=4/11/2023");
                        url=url.replace(/&serp=([^&]*)/,"");

            console.log("new_url=",url);
            setTimeout(function() {
            var promise=MTP.create_promise(url,parse_prices,parse_prices_then,function() { GM_setValue("returnHit",true); }); }, 250);
            return;

        }
        var init_lowest=1000000000000;
        var lowest=init_lowest;
        var price;
        for(price of prices) {
            console.log("price=",price);
            if(lowest>parseInt(price.innerText.trim().replace(/\$/g,""))) {
                lowest=parseInt(price.innerText.trim().replace(/\$/g,""));
            }
        }
        if(lowest<init_lowest) {
            my_query.fields.rate="$"+lowest;

            resolve("");
        }
        else if(my_query.try_count.query===0) {
            my_query.try_count.query++;
            query_search(my_query.name, resolve, reject, query_response,"query");
            return;
        }
        else
        {
            reject("");
        }
    }

    function parse_prices_then() {
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
       var a=decodeURI(document.querySelector("crowd-form a").href.replace(/.*\?q\=(.*)$/,"$1")).replace(/\+/g," ");

        a=a.replace("%2C","");
        //a=a.replace(/([A-Z])T/,"$1e");

        my_query={name:a,fields:{rate:""},done:{},
		  try_count:{"query":0,"prices":0},
		  submitted:false};
        my_query.name=my_query.name.replace("%2C","");
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }

})();