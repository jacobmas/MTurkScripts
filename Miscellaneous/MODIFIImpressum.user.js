// ==UserScript==
// @name         MODIFIImpressum
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
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/5d182eab203f5a4a8711280d92bc6e0a6aeb5e2b/Govt/Government.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/1f32b2f6b29fc538e3b56e1822d1fa79d624a93f/global/Address.js

// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A1MT0G0JFCSPG8",true);
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
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !is_bad_name(b_name) && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        reject("Nothing found");
        return;
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        submit_if_done();
    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0; 
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined&&Address!==undefined &&Gov!==undefined) { callback(); }
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
    function parse_site(doc,url,resolve,reject) {
        var links=doc.links,i;
        var promise_list=[];
        var new_url;
        var imprint="";
        for(i=0;i<links.length;i++) {
            links[i].href=MTP.fix_remote_url(links[i].href,url);
            if(/Impressum|Legal Notice/i.test(links[i].innerText)) {
                var promise=MTP.create_promise(links[i].href,parse_impressum,resolve,function() { submit_if_done(); });
                var promise2=MTP.create_promise(links[i].href,Address.scrape_address,MTP.my_then_func,function() { submit_if_done(); },{type:"",depth:1});

                return;
            }
            if(/Imprint/.test(links[i].innerText)) imprint=links[i].href;
        }
        if(imprint) {
                            var promise=MTP.create_promise(imprint,parse_impressum,resolve,function() { submit_if_done(); });
            return;
        }
        if(promise_list.length>0) {
            Promise.all(promise_list).then(function() {
                resolve(""); });
        }
        else {
            parse_impressum(doc,url,resolve,reject);
        }
    }
    function parse_impressum(doc,url,resolve,reject) {
        var TaxID,match;
        Gov.scrape_lone_emails(doc,url);
        if(Gov.email_list.length>0) {
            my_query.fields.email=Gov.email_list[0];
        }
        if(match=doc.body.innerText.match(/DE[\s*\d]{9,}/)) my_query.fields.TaxID=match[0];
//        var elem=doc.body.innerText;
        if((match=doc.body.innerText.match(/(?:Fon|Tel)[a-z\/]*[\.:]*\s*([\s\+\d\-–\(\)\t]*[\+\d\-–\(\)]+[\s\+\d\-–\(\)\t]*)/)) &&(!my_query.fields.phone||my_query.fields.phone==="na") ) {
            console.log("phone match="+match);
            my_query.fields.phone=match[1];
        }
        var re=/(?:^|\n)(.*\s(?:GmbH|KG|SE|eG|AG)\s*)(.*)\n(.*)/;
        if((match=doc.body.innerText.match(re))&&my_query.fields.companyName==="na") {
            add_name(match[1].trim()+"\n"+match[2].trim()+"\n"+match[3].trim());
        }

        var links=doc.links;
        var x;
        for(x of links) {
            if(/^tel:/.test(x.href) &&(!my_query.fields.phone||my_query.fields.phone==="na")) {
                my_query.fields.phone=x.innerText;
            }
        }

        resolve("");
    }
    function paste_address(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain").trim();
        add_address(text);
        
    }
    function add_address(text) {
        var add=new Address(text.replace(/\n+/g,","),0);
        console.log("add="+JSON.stringify(add));
        var add_name="Street name & no.";
        if(!add.city) my_query.fields[add_name]=text;
        else {
            my_query.fields[add_name]=add.address1;
            my_query.fields.zip=add.postcode;
            my_query.fields.city=add.city;
        }
        add_to_sheet();
    }
    function paste_contacts(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain").trim();
        let split=text.split(/[,\n]+/);
        var i;
        for(i=0;i<split.length&&i<4;i++) {
            my_query.fields["contactName"+(i+1)]=split[i];
        }
        add_to_sheet();
    }
    function paste_name(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain").trim();
        add_name(text);
    }
    function add_name(text) {
        if(text.indexOf("\n")===-1) my_query.fields.companyName=text;
        else {
            var match=text.match(/^([^\n]*)\n([^]*)$/);
            if(match) {
                console.log("match="+match);
                my_query.fields.companyName=match[1];
                add_address(match[2]);
            }
            else {
                console.log("Failed to match regex on text containing \\n");
            }
        }
        add_to_sheet();
    }

    function init_Query() {
        console.log("in init_query");
        var i;
        var street=document.querySelector("crowd-input[name^='Street name']");
        street.addEventListener("paste",paste_address);

        document.querySelector("crowd-input[name^='contactName1']").addEventListener("paste",paste_contacts);
        document.querySelector("crowd-input[name='companyName']").addEventListener("paste",paste_name);
        //var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        var url=document.querySelector("form a").innerText;
        if(!/^http/.test(url)) url="http://"+url;
        my_query={url:url,fields:{phone:"na"},done:{},submitted:false};
         document.querySelectorAll("crowd-input").forEach(function(elem) {
            if(elem.name!=="email") my_query.fields[elem.name]="na";
            else my_query.fields[elem.name]="na@na.com";
             add_to_sheet();
            elem.addEventListener("change",function(e) {
                console.log("e.value="+e.value);
                my_query.fields[e.target.name]=e.target.value;
                add_to_sheet();
            });

        });
        for(i=1;i<=4;i++) my_query.fields["contactName"+i]="na";
        //console.log(JSON.stringify(my_query.fields));
	console.log("my_query="+JSON.stringify(my_query));
        var promise=MTP.create_promise(my_query.url,parse_site,query_promise_then);
    }

})();