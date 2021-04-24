// ==UserScript==
// @name         Jonathan W Lutz
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Postal codes for companies
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
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A1VGPMQATKBG9M",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }
    function is_good_address(add) {
        console.log("add="+JSON.stringify(add));
        if(!add.postcode) return false;
        if(my_query.state&&add.state!=my_query.state&&state_map[my_query.state]!=add.state) return false;
        if(my_query.country&&my_query.country!="United States" && add.country && add.country!=my_query.country) return false;
        return true;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        var temp_add;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            let r_wrl=doc.querySelector(".rwrl");

            console.log("b_algo.length="+b_algo.length);
            if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
                if(parsed_context.Address&&(temp_add=new Address(parsed_context.Address))&&temp_add.postcode
                   && is_good_address(temp_add)) {
                    console.log("temp_add="+JSON.stringify(temp_add));
                    resolve({postcode:temp_add.postcode});
                    return;
                }
                else if(parsed_context.Address) {
                    let postal=parsed_context.Address.match(/(\s[A-Z]*[0-9]+[A-Z]*)+$/);
                    if(postal) {
                        console.log("temp_add="+JSON.stringify(temp_add)+" postal="+postal[0]);
                        resolve({postcode:postal[0].trim()});
                        return;
                    }
                }

            }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            if(r_wrl) {
                let text=r_wrl.innerText.replace(/^[^0-9]+/,"").replace(/(,\s*[A-Z]{2}\s+[0-9]{5})\s.*$/,"$1");
                if((temp_add=new Address(text)) && is_good_address(temp_add)) {
                    console.log("r_wrl,temp_add="+JSON.stringify(temp_add));
                resolve({postcode:temp_add.postcode});
                return;
                }
                let postal=r_wrl.innerText.match(/Postal Code:((\s[A-Z]*[0-9]+[A-Z]*)+)/i);
                if(postal) {
                    resolve({postcode:postal[1]});

                return;
                }
            }

            for(i=0; i < b_algo.length&&i<3; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(/dandb\.com/.test(b_url)) {
                    p_caption=p_caption.replace(/\. Reviews .*$/,"").replace(/^[^0-9]+/,"");
                    if((temp_add=new Address(p_caption)) && is_good_address(temp_add)) {
                        console.log("b_algo,temp_add="+JSON.stringify(temp_add));
                        resolve({postcode:temp_add.postcode});
                        return;
                    }
                }
                else if(!/crunchbase\.com/.test(b_url)) {
                    p_caption=p_caption.replace(/(, [A-Z]{2} [0-9]{5})\s.*$/,"$1")
                    .replace(/ T[A-Za-z]+:\s+.*$/,"").replace(/ P .*$/,"").replace(/.*Address\s*:\s*/,"").replace(/\s+\+.*$/,"").replace(/,\s*$/,"");
                    if((temp_add=new Address(p_caption)) && is_good_address(temp_add)&&temp_add.address1) {
                        console.log("b_algo,temp_add="+JSON.stringify(temp_add));
                        resolve({postcode:temp_add.postcode});
                        return;
                    }
                    else {
                        console.log("bad temp_add="+JSON.stringify(temp_add));
                    }
                }

                
               /* if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i)
		   && (b1_success=true)) break;*/
            }
            if(b1_success && (resolve({url:b_url})||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
	do_next_query(resolve,reject,type);
        return;
    }
    function do_next_query(resolve,reject,type) {
        var search_str=my_query.name+" "+my_query.city+" "+my_query.state+(my_query.country&&my_query.country!="United States"?" "+my_query.country:"")+" headquarters address";
        if(type==="query" && my_query.try_count[type]===0) {
            query_search(search_str, resolve, reject, query_response,"query");
            my_query.try_count[type]++;
            return;
        }
        if(type==="query" && my_query.try_count[type]===1) {
            search_str="+\""+my_query.name+"\" "+my_query.city+" "+my_query.state+(my_query.country&&my_query.country!="United States"?" "+my_query.country:"")+"  address";

            query_search(search_str, resolve, reject, query_response,"query");
            my_query.try_count[type]++;
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
        my_query.done.query=true;
        if(result&&result.postcode) {

            my_query.fields.postalcode=result.postcode;
        }
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
        var is_done=true,x,is_done_dones=false;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        if(!my_query.fields.postalcode) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(!is_done && is_done_dones) {
            GM_setValue("returnHit",true);
        }
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var p=document.querySelectorAll("crowd-form p");
       
        my_query={name:p[0].innerText.replace(/^[^:]*:\s*/,""),
                  city:p[1].innerText.replace(/^[^:]*:\s*/,""),
                  state:p[2].innerText.replace(/^[^:]*:\s*/,""),
                  country:p[3].innerText.replace(/^[^:]*:\s*/,""),
                  fields:{postalcode:""},done:{"query":false},
		  try_count:{"query":0},
		  submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+" "+my_query.city+" "+my_query.state+(my_query.country&&my_query.country!="United States"?" "+my_query.country:"")+" address";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search "+search_str);
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            my_query.done.query=true;
            submit_if_done();
            console.log("Failed at this queryPromise " + val);  });
    }

})();