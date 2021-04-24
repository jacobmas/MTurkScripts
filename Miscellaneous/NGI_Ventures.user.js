// ==UserScript==
// @name         NGI_Ventures
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
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A2N4ND3UOD151G",true);
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
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context)); } 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
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
    function parse_funeral_home(doc,url,resolve,reject) {
        var temp;

        var url_list=["consolidatedfuneralservices.com","frazerconsultants.com","batesvilletechnology.com","frontrunner360.com",
                     ".frontrunnerpro.com",".funeralone.com",".funeralnet.com",".funeraltech.com","\/\/funeralresults.com",".remembertributes.info",
                     ".funeralhomewebsite.com",".articdesigns.com",'.batesville.com','funeralinnovations.com'];
        var curr_url;
         if(/www\.dignitymemorial\.com/.test(url)) {
           resolve('https://www.dignitymemorial.com');
            return;
        }
        for(curr_url of url_list) {
          //  console.log(curr_url);
            if((temp=doc.querySelector("a[href*='"+curr_url+"']"))) {
                resolve(temp.href);
                return;
            }
        }
        var links=doc.links;
        if(doc.links.length===1 && /enable-javascript\.com/.test(links[0].href)) {
            resolve("https://deadsite.com");
            return;
        }
        var footer=doc.querySelectorAll("footer a");
        if(!footer) footer=doc.querySelectorAll("#footer a");
        if(footer.length>0) {
            console.log("footer="+footer);
            var j;
            let domain=MTP.get_domain_only(url,true);
            for(j=footer.length-1; j>=0; j--) {

                let last_link=MTP.fix_remote_url(footer[j].href,url);
                console.log("Last_link="+last_link);
                if(last_link&&last_link.length>0&&!MTP.is_bad_url(last_link,bad_urls,-1)&&/http/.test(last_link) && last_link.indexOf(domain)===-1) {
                    resolve(last_link);
                    return;
                }
            }
        }

        var a;
        if(doc.title.length===0||/.hugedomains.com/.test(url)) {
            resolve("https://deadsite.com");
            return;
        }
        for(a of links) {
            console.log("url="+a.href);
        }
        //resolve(url);
        //return;
          reject("");
    }
    function parse_funeral_home_then(result) {
        my_query.fields.technologyProviderUrl=result;
        submit_if_done();
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }



    function init_Query()
    {
        bad_urls=default_bad_urls;
        console.log("in init_query"+JSON.stringify(bad_urls));
        var i;
       var a=document.querySelectorAll("form a");
        var url=a[1].innerText;
        if(!/http/.test(url)) url='http://'+url;
        console.log("url="+url);
        my_query={url:url,fields:{},done:{},
		  try_count:{"query":0},
		  submitted:false};
        var promise=MTP.create_promise(url,parse_funeral_home,parse_funeral_home_then,function(response) {
            console.log("Failed at url="+url);
            my_query.fields.technologyProviderUrl="https://deadsite.com";
            submit_if_done();
        });
    }

})();