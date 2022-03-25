// ==UserScript==
// @name         Jon HolmanMyChart
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Classify with MyChart, NextGen (nextmd.com) or Other or None for Patient portals, check that it's right
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
    var bad_urls=["birdeye.com"];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(50000,750+(Math.random()*1000),[],begin_script,"AHJ6Q0B967QOK",true);
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
            for(i=0; i < b_algo.length&&i<2; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls,4,2) && !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i)
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
        if(type==="query" && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            query_search(my_query.name+" "+my_query.city+" "+my_query.state, resolve, reject, query_response,"query");
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
        my_query.url=result;
        var promise=MTP.create_promise(my_query.url,parse_for_mychart,parse_for_mychart_then,function() { GM_setValue("returnHit",true); });
    }
    var next_md_re=/\.nextmd\.com/;
    var other_re_str="\\.eclinicalweb.com|www\\.myadventisthealthportal\\.org|\\.athenahealth\\.com|\\.followmyhealth\\.com|"+
        "\\.healow\\.com|\\.gobreeze.com|\\.ecwcloud\\.com|\\.myezyaccess\\.com|\\.myadsc\\.com|\\.iqhealth\\.com";
    var other_re=new RegExp(other_re_str);
    console.log("other_re=",other_re);
    function parse_for_mychart(doc,url,resolve,reject) {
        console.log("parse_for_mychart,url=",url);
       // console.log("doc.links=",doc.links);
        let a=doc.querySelectorAll("a");
        //console.log("doc a querySelector=",a);
        //console.log("doc=",doc);
        var x;
        if(doc.links.length===0) {
            console.log("No links, js-load, return");
            reject("");
            return;
        }
        for(x of doc.links) {

            x.href=MTP.fix_remote_url(x.href,url);
            //console.log("x.href=",x.href,"x.innerText=",x.innerText);
            if(/^MyChart$/.test(x.innerText)||/https:\/\/mychart\./.test(x.href)||/[^A-Za-z]MyChart/i.test(x.href)) {
                console.log("MyChart, x=",x);
                my_query.fields.classification="MyChart";
                resolve("");
               //var promise=MTP.create_promise(x.href,parse_for_patientportal,resolve,reject);
                return;
            }
            if(next_md_re.test(x.href)) {
                console.log("next_md_re matched, x.href=",x.href);
                my_query.fields.classification="NextGen";
                resolve("");
                return;
            }
            if(other_re.test(x.href)) {
                console.log("other_re matched, x.href=",x.href);
                 my_query.fields.classification="Other";

            }
            if(/Patient Portal|Patient Login|Login to|Log in to|My Account/i.test(x.innerText)) {
                console.log("x=",x);
                let domain1=MTP.get_domain_only(url,true),domain2=MTP.get_domain_only(x.href,true);
                console.log("domain1=",domain1,"domain2=",domain2);
                if(domain1!=domain2) {
                    if(/mychart\.com/.test(domain2))                 my_query.fields.classification="MyChart";
                    else                 my_query.fields.classification="Other";
                    resolve("");
                    return;
                }
                if(/^dignityhealth\.org$|^bswhealth\.com$/.test(domain1)) {
                    my_query.fields.classification="Other";
                    resolve("");
                    return;
                }
                console.log("Doing promise");

                var promise=MTP.create_promise(x.href,parse_for_patientportal,resolve,reject);
                return;
            }

        }
        if(my_query.fields.classification==="Other") {
            console.log("Found other portal");
             resolve("");
               //var promise=MTP.create_promise(x.href,parse_for_patientportal,resolve,reject);
                return;
        }
        console.log("Patient portal not found");
        my_query.fields.classification="None";
        resolve("");
    }

    function parse_for_patientportal(doc,url,resolve,reject) {
         var x;

        for(x of doc.links) {
            if(next_md_re.test(x.href)) {
                console.log("next_md_re matched, x.href=",x.href);
                my_query.fields.classification="NextGen";
                resolve("");
                return;
            }
            if(other_re.test(x.href)) {
                                console.log("other_re matched, x.href=",x.href);

                my_query.fields.classification="Other";
                  //  resolve("");
                //return;
            }
            if(/^MyChart$/.test(x.innerText)||/https:\/\/mychart\./.test(x.href)) {
                console.log("MyChart, x=",x);
                my_query.fields.classification="MyChart";
                resolve("");
               //var promise=MTP.create_promise(x.href,parse_for_patientportal,resolve,reject);
                return;
            }
        }
        if(my_query.fields.classification) {
            resolve("");
            return;
        }
        else {
            reject("");
        }
    }

    function parse_for_mychart_then() {
        console.log("my_query.fields=",my_query.fields);
        my_query.done.query=true;
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
        var x,fields;
        var item=document.querySelector("crowd-classifier").shadowRoot;
        fields=item.querySelectorAll("button.category-button")
        console.log("fields=",fields);
        if(my_query.fields.classification==="MyChart") {
            fields[0].click();
        }
        else if(my_query.fields.classification==="NextGen") {
            fields[1].click();
        }
        else if(my_query.fields.classification==="Other") {
            fields[2].click();

        }
        else if(my_query.fields.classification==="None") {
            fields[3].click();

        }

    }

    function submit_if_done() {
        var is_done=true,x,is_done_dones=x;
        add_to_sheet();
        console.log("my_query.done=",my_query.done);
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        for(x in my_query.fields) if(!my_query.fields[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) {
             var item=document.querySelector("crowd-classifier").shadowRoot;
        let mybutton=item.querySelector("button[type='submit']");
            console.log("Submitting");
            if(GM_getValue("automate")) {
               setTimeout(function() { mybutton.click(); }, 750+(Math.random()*1000)); }
        }
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

        var target=document.querySelector("p[style^='color:blue']");
        console.log(target.innerText);
        my_query={full_name:target.innerText.trim(),fields:{classification:""},done:{query:false},
		  try_count:{"query":0,"healthgrades":0,"webmd":0},
		  submitted:false};
        my_query.name=my_query.full_name.replace(/\s[\(\d].*$/,"");


                var city_state_re=/([A-Z][A-Za-z\s]+)\s([A-Z]{2})$/;
        let match=my_query.full_name.match(city_state_re);
        var city="",state="";
                console.log("match=",match);

        if(match) {
            city=match[1].replace(/^.*\s(Rd|St|Blvd|Way|Hwy)\s/,"");
            state=reverse_state_map[match[2]];
        }
        my_query.city=city;
        my_query.state=state;

        console.log("my_query=",my_query);

        var search_str=my_query.full_name;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }

})();