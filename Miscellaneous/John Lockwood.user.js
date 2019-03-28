// ==UserScript==
// @name         John Lockwood
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  General and Admissions Emails
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
// @grant  GM_getValue
// @grant GM_setValue
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
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,200,[],begin_script,"A20ZPASH2K4O1S",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

    function query_response(response,resolve,reject,try_count) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        if(try_count===undefined) try_count=0;
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
                b_url=b_algo[i].getElementsByTagName("a")[0].href.replace(/\/$/,"");
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls,-1) && !is_bad_name(b_name) && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(try_count===0) {
            query_search("admissions site:"+my_query.domain,resolve,reject,query_response,++try_count);
            return;
        }
        reject("Nothing found");
        return;
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,try_count) {
        if(try_count===undefined) try_count=0;
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,try_count); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }


    /* TODO: NOT READY */
    var call_contact_page=function(url,callback,extension) {

        if(extension===undefined) { extension='';
                                   MTurk.queryList.push(url); }
        GM_xmlhttpRequest({method: 'GET', url: url,onload: function(response) {
            var doc = new DOMParser().parseFromString(response.responseText, "text/html");
            contact_response(doc,response.finalUrl,{extension:extension,callback:callback}); },
                           onerror: function(response) { console.log("Fail");
                                                        MTurk.doneQueries++;
                                                        callback(); },
                           ontimeout: function(response) { console.log("Fail timeout");
                                                          MTurk.doneQueries++;
                                                          callback(); }
                          });
    };


    /**
 * contact_response Here it searches for an email TODO:FIX */
    var contact_response=function(doc,url,extra) {
        var i,j, my_match,temp_email,encoded_match,match_split;
        var extension=extra.extension,callback=extra.callback;
        if(extension===undefined) extension='';
        console.log("in contact_response "+url);
        var short_name=url.replace(my_query.url,""),links=doc.links,email_matches,phone_matches;
        var replacement=url.match(/^https?:\/\/[^\/]+/)[0];
        var contact_regex=/(Contact|About|Staff|Team)/i,bad_contact_regex=/^\s*(javascript|mailto):/i;
        console.log("replacement="+replacement);
        var temp_url,curr_url;
        if(email_matches=doc.body.innerHTML.match(email_re)) {

            for(j=0; j < email_matches.length; j++) {
                if(!MTP.is_bad_email(email_matches[j]) &&
                   !my_query.email_list.includes(email_matches[j].replace(/^20/,""))) my_query.email_list.push(email_matches[j].replace(/^20/,""));
            }
            console.log("Found email hop="+my_query.fields.email+", typeof(my_query.fields.email)="+typeof(my_query.fields.email));
        }
        if(phone_matches=doc.body.innerText.match(phone_re)) my_query.fields.phoneNumber=phone_matches[0];
        for(i=0; i < links.length; i++)
        {
            my_query.fields.email="";
            //if(my_query.fields.email.length>0) break;
           // console.log("i="+i+", text="+links[i].innerText);
            if(extension==='' && contact_regex.test(links[i].innerText) && !bad_contact_regex.test(links[i].href) &&
               !MTurk.queryList.includes(links[i].href=MTurkScript.prototype.fix_remote_url(links[i].href,url)))
            {
                MTurk.queryList.push(links[i].href);
                console.log("*** Following link labeled "+links[i].innerText+" to "+links[i].href);
                call_contact_page(links[i].href,callback,"NOEXTENSION");
                continue;
            }
            if(links[i].dataset.encEmail && (temp_email=MTurkScript.prototype.swrot13(links[i].dataset.encEmail.replace(/\[at\]/,"@")))
               && !MTurkScript.prototype.is_bad_email(temp_email)) my_query.fields.email=temp_email;
            if(!(links[i].href.indexOf("amazonaws.com")===-1 && links[i].href.indexOf("mturkcontent.com")===-1)) continue;
            if(links[i].href.indexOf("cdn-cgi/l/email-protection#")!==-1 && (encoded_match=links[i].href.match(/#(.*)$/)) &&
               (temp_email=MTurkScript.prototype.cfDecodeEmail(encoded_match[1]).replace(/\?.*$/,"")) &&
               !MTurkScript.prototype.is_bad_email(temp_email)) my_query.fields.email=temp_email;
            if((temp_email=links[i].href.replace(/^mailto:\s*/,"").match(email_re)) &&
               !MTurkScript.prototype.is_bad_email(temp_email)) my_query.fields.email=temp_email[0];
            if(links[i].href.indexOf("javascript:location.href")!==-1 && (temp_email="") &&
               (encoded_match=links[i].href.match(/String\.fromCharCode\(([^\)]+)\)/)) && (match_split=encoded_match[1].split(","))) {
                for(j=0; j < match_split.length; j++) temp_email=temp_email+String.fromCharCode(match_split[j].trim());
                my_query.fields.email=temp_email;
            }
            if(links[i].href.indexOf("javascript:DeCryptX(")!==-1 &&
               (encoded_match=links[i].href.match(/DeCryptX\(\'([^\)]+)\'\)/))) my_query.fields.email=MTurkScript.prototype.DecryptX(encoded_match[1]);
            if(/^tel:/.test(links[i].href)) my_query.fields.phoneNumber=links[i].href.replace(/^tel:/,"");
           // console.log("my_query.fields.email type="+typeof(my_query.fields.email)+", typeof(\"fuck@fuck.com\")="+typeof("fuck@fuck.com"));
            //if(typeof(my_query.fields.email)!=="string") console.log("links["+i+"].href="+links[i].href);
            if(!MTP.is_bad_email(my_query.fields.email) && !my_query.email_list.includes(my_query.fields.email.replace(/^20/,""))&&my_query.fields.email.length>0)
            {
                console.log("Adding "+typeof(my_query.fields.email)+" "+JSON.stringify(my_query.fields.email)+" to "+JSON.stringify(my_query.email_list));
                my_query.email_list.push(my_query.fields.email.replace(/^20/,""));
            }

        }
        console.log("* doing doneQueries++ for "+url);
        MTurk.doneQueries++;
        //add_to_sheet();
        //submit_if_done();
        callback();
        return;
    };

    /* Following the finding the district stuff */
    function query_promise_then(result) {
    }

    /* Following the finding the district stuff */
    function query2_promise_then(result) {
        console.log("query2, result="+result);
        call_contact_page(result,submit_if_done);
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
        var x,field,i;
        for(i=0;i<my_query.email_list.length;i++) {
            if(((/adm|enroll/i.test(my_query.email_list[i]) && !/(grad.*|g)adm/i.test(my_query.email_list[i]))||
                /ugadm/.test(my_query.email_list[i]))
                && document.getElementsByName("email2")[0].value.length===0) {
                console.log("Found admissions "+my_query.email_list[i]);
                document.getElementsByName("email2")[0].value=my_query.email_list[i];
            }
            else if((/(gr.*|g)adm/i.test(my_query.email_list[i])&&!/ugadm/.test(my_query.email_list[i])) ||
                   (/grad/i.test(my_query.email_list[i]) && document.getElementsByName("email3")[0].value.length===0)
                   ) document.getElementsByName("email3")[0].value=my_query.email_list[i];

            if(/^publicrelatio|^communicat|((^|[^A-Za-z]+)info|inquire)/i.test(my_query.email_list[i]) ||

               (/((^|[^A-Za-z]+)pr($|[^A-Za-z]+))|webmaster|^Service/i.test(my_query.email_list[i]) &&
               document.getElementsByName("email1")[0].value.length===0)) document.getElementsByName("email1")[0].value=my_query.email_list[i];
            else if(document.getElementsByName("email1")[0].value.indexOf(my_query.domain)===-1 && /contact|publicrelatio|(^info)/i.test(my_query.email_list[i])) {
                document.getElementsByName("email1")[0].value=my_query.email_list[i]; }


        }
        for(x in my_query.fields) {
            if(field=document.getElementsByName(x)[0]) {
                field.required=false;
                field.value=my_query.fields[x];
            }
        }
    }

    function submit_if_done() {
        my_query.email_list.sort();
        console.log("my_query.email_list="+JSON.stringify(my_query.email_list));
        var is_done=true,x,is_done_done;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_done=is_done;
        for(x in my_query.fields) if(my_query.fields.length===0) is_done=false;

        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }

    function init_Query()
    {
                my_query.em

        console.log("in init_query");
        var i;
        //var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        my_query={url:document.querySelector("form a").href,name:"",fields:{email:""},done:{},submitted:false,email_list:[]};
        my_query.domain=MTP.get_domain_only(my_query.url,true);
	console.log("my_query="+JSON.stringify(my_query));
        var search_str;
        var promise = new Promise((resolve,reject) => {
            console.log("Beginning homepage search");
            call_contact_page(my_query.url,submit_if_done);
        });

        const queryPromise2 = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            search_str="admissions site:"+my_query.domain;
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise2.then(query2_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise2 " + val); GM_setValue("returnHit",true); });

         const queryPromise3 = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            search_str="+\"admissions@"+my_query.domain+"\" site:"+my_query.domain;
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise2.then(query2_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise2 " + val); GM_setValue("returnHit",true); });


    }

})();