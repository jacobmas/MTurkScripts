// ==UserScript==
// @name         VersaCommerce GmbH
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Parse impressum for company
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
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A2IABYMPJX2HGX",true);
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
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].querySelector("h2 a").href;
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

    function find_impressum(doc,url,resolve,reject) {
        var links=doc.querySelectorAll("a");
        var x,promise;
        for(x of links) {
            //console.log("x.href="+x.href+",x.innerText="+x.innerText);
            if(/Impressum|Imprint/i.test(x.innerText)||/impressum/i.test(x.href)) {
                var new_url=MTP.fix_remote_url(x.href,url);
                promise=MTP.create_promise(new_url,parse_impressum,resolve,reject);
                return;
            }
        }
         //promise=MTP.create_promise(url,parse_impressum,resolve,reject);
        reject("Failed to find an Impressum at "+url);
    }

    function parse_impressum(doc,url,resolve,reject) {
        console.log("parse_impressum, url="+url);
       var x;
        console.log("len="+doc.body.innerText.length);
        var scripts=doc.querySelectorAll("script");
        var styles=doc.querySelectorAll("style");
        for(x of scripts) {
            x.parentNode.removeChild(x);
        }
                for(x of styles) {
            x.parentNode.removeChild(x);
        }

                console.log("len="+doc.body.innerText.length);

       doc.body.innerHTML=doc.body.innerHTML.replace(/\<br[^\>]*\>/g,"\n")
        .replace(/(\<\/(?:p|div)\>)/g,"$1\n")
        .replace(/\n{2,}/g,"\n");
        console.log(doc.body.innerText);

        var rep=doc.body.innerText.match(/(?:Gesch.ftsf.hrer)(?:in)?:?\s*(.*[A-Za-z]{1}.*)/);

        if(!rep) rep=doc.body.innerText.match(/(?:Geschäftsführer|Gesch.ftsf.hrung|Gesellschafter|Vertreten durch):?\s*(.*[A-Za-z]{1}.*)/);
                if(!rep) rep=doc.body.innerText.match(/(?:Inhaber|Inh\.)[^:\n]*:\s*(.*)/);

        if(!rep) rep=doc.body.innerText.match(/(?:Inhaber|Inh\.):?\s*(.*)/);
        var phone=doc.body.innerText.match(/(?:Telefon|Tel\.?|Fon|Fone|Tel.*:|T:)\s*:?\s*([\+\(\)\-\/0-9\s\.–]{5,})/);

        var add_stuff=doc.body.innerText.match(/Impressum(\n*)(.*GmbH.*)\n(?:\s*\n){0,2}(?:(?:\s*Inh\.|\s*Inhaber|\s*Handwerksmeister|\s*Herr\s).*\n)?(.*)\n(\s*(?:D\s*[\-–]\s*)?[\d]{5})\s*(.*)//i);


        if(!add_stuff) add_stuff=doc.body.innerText.match(/(.*GmbH.*)\n(?:\s*\n){0,2}(?:(?:\s*Inh\.|\s*Inhaber|\s*Handwerksmeister|\s*Herr\s).*\n)?(.*)\n(\s*(?:D\s*[\-–]\s*)?[\d]{5})\s*(.*)/);
        if(!add_stuff)
        add_stuff=doc.body.innerText.match(/(.*)\n(?:\s*\n|.*[:@].*\n){0,3}(?:(?:\s*Inh\.|\s*Inhaber|.*Gesch.ftsf.hrer|\s*Handwerksmeister|\s*Herr\s).*\n)?(.*)\n(\s*(?:D-)?[\d]{5})\s*(.*)/);
        Gov.scrape_lone_emails(doc,url);
        var reg=null;
                if(!reg) reg=doc.body.innerText.match(/((?:HRA|HRB)\s(?:Nr\.\s)?\d{2,}(\s*\d*)*)/);

        if(!reg) reg=doc.body.innerText.match(/(?:Registernummer|Handelsregister|HRB Nummer|Steuer Nr\.?|Eingetragen ins Vereinsregister)(?::)?\s*(.{2,}\d{2,}\.{0,})/);
                if(!reg) reg=doc.body.innerText.match(/Amtsgericht (.*)/);

//        if(!reg) reg=doc.body.innerText.match(/((?:HRA|HRB)\s(?:Nr\.\s)?\d{2,})/);
        if(!reg) reg=doc.body.innerText.match(/((?:Steuer-?nummer|Steu­er­num­mer|USt-ID|UstID-Nr.|Umsatzsteuer-ID.*\n?DE|Umsatzsteuer.*§27a.*\n?DE):?.*\d.*)/i);
        if(rep) {
            console.log(rep);
            my_query.fields.representative=rep[1];
        }
        if(add_stuff) {
            my_query.fields.company_name=add_stuff[1].trim().replace(/Impressum/,"").trim();
            my_query.fields.street=add_stuff[2].trim();
            my_query.fields.zip=add_stuff[3].trim();
            my_query.fields.city=add_stuff[4].replace(/([a-z])([A-Z].*)$/,"$1");
            console.log(add_stuff);
        }
        else {
            let match=doc.body.innerText.match(/Anschrift:(.*)/);
            if(match) console.log("Anschrift match="+match);
        }
        if(phone) {
            my_query.fields.phone=phone[1].replace(/[A-Za-z].*$/,"").trim();
        }
        if(Gov.email_list.length>0) {
            my_query.fields.email=Gov.email_list[0].email;
        }
        if(reg) {
            my_query.fields.reg=reg[0].replace(/\n/g," ");
            console.log("reg="+reg);
            document.querySelectorAll("[name='company_name']")[1].value=my_query.fields.reg;
        }
        if(!my_query.fields.representative && my_query.fields.company_name) {
            my_query.fields.representative=my_query.fields.company_name;
            my_query.fields.company_name=my_query.name;
        }


        resolve("");
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
        var i;
        var wT=document.querySelector("crowd-form").getElementsByTagName("table")[0];
        var small=wT.rows[1].cells[1].querySelector("small");
        console.log(wT.rows[1].innerText);
        small.parentNode.removeChild(small);

        var dont=document.getElementsByClassName("dont-break-out");
        my_query={name:wT.rows[1].cells[1].innerText.trim().replace(/^Entry:.*\n/,"").replace(/[\(\)]/g,"").trim(),
                  url:wT.rows[1].cells[0].querySelector("a").href.replace(/https/,"http"),
                  fields:{},done:{},
		  try_count:{"query":0},
		  submitted:false};
	console.log("my_query="+JSON.stringify(my_query));

        var promise=MTP.create_promise(my_query.url,find_impressum,submit_if_done,function(val) {
            console.log("Failed at this Promise " + val); GM_setValue("returnHit",true); });
  /*      var search_str;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });*/
    }

})();