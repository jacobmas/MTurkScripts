// ==UserScript==
// @name         Aidin
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
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
    var bad_urls=["nursinghomesite.com","nursinghomerating.org"];
    var MTurk=new MTurkScript(20000,200,[],begin_script,"A3S8R4UTTPQDCC",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name,p_caption,i)
    {
        if(my_query.name.length===0 ) return false;
        console.log("in is_bad_name");
        var reg=/[-\s\'\"’]+/g,b_replace_reg=/\s+[\-\|–]{1}.*$/g;
        b_name=b_name.replace(/[,\s\.]*$/,"");
        var lower_b=b_name.toLowerCase().replace(reg,""),
            lower_my=my_query.name.replace(/\s(-|@|&|and)\s.*$/).toLowerCase().replace(reg,"").replace(/,.*$/,"");
        if(lower_b.indexOf(lower_my)!==-1 || lower_my.indexOf(lower_b)!==-1) return false;
        var b_name2,j;
        b_name2=b_name.split(/\s+[\-\|–]{1}\s+/);
        console.log("b_name2="+JSON.stringify(b_name2));
        for(j=0;j<b_name2.length;j++) {
            my_query.name=my_query.name.replace("’","\'");
            console.log("b_name="+b_name2[j]+", my_query.name="+my_query.name);
            if(MTP.matches_names(b_name2[j],my_query.name)) return false;
            if(b_name2[j].toLowerCase().indexOf(my_query.name.split(" ")[0].toLowerCase())!==-1) return false;
        }
        return true;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response, type="+type+"\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb,match;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(type==="url" && b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
            console.log("parsed_context="+JSON.stringify(parsed_context));
            if(parsed_context.url!==undefined && !MTP.is_bad_url(parsed_context.url,bad_urls,-1)) {
                resolve(parsed_context.url); return true; }
        }
            if(type==="url" && lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
                if(parsed_lgb.url && !MTP.is_bad_url(parsed_lgb.url,bad_urls,-1)) {
                resolve(parsed_lgb.url); return true; }
                     }
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(type==="url" && (match=b_algo[i].innerText.match(/Fax:\s*([\d\-\(\)\.\s]+)/)) &&
                  my_query.fields.fax.length===0) {
                    let match2=match[1].match(phone_re);
                    if(match2) {
                        my_query.fields.fax=match2[0];
                        console.log("* Found fax="+my_query.fields.fax+" in query_response");
                    }
                }
                if(type==="url" && !MTurkScript.prototype.is_bad_url(b_url, bad_urls,4,2) &&
                   !is_bad_name(b_name,p_caption,i) && (b1_success=true)) break;
                if(type==="npidb" &&
                   (!is_bad_name(b_name,p_caption,i)||b_name.toLowerCase().indexOf(my_query.short_name.toLowerCase())!==-1)

                   && (b1_success=true)) break;
                if(type==="npiprofile" &&
                   (!is_bad_name(b_name,p_caption,i)||b_name.toLowerCase().indexOf(my_query.short_name.toLowerCase())!==-1)

                   && (b1_success=true)) break;
                 if(type==="providerdata" &&
                   (!is_bad_name(b_name.replace(/\s[\(\-]+.*$/,""),p_caption,i)
                    ||b_name.toLowerCase().indexOf(my_query.short_name.toLowerCase())!==-1)
                   && (b1_success=true)) break;

            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(type==="url" && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            query_search(my_query.name+" "+my_query.city+" "+my_query.state+" fax",resolve,reject,query_response,type);
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
        console.log("query_promise_then,result="+result);
        my_query.url=result;
        MTurk.queryList.push(result.replace(/\/$/,""));
        var promise=MTP.create_promise(result,find_fax,find_fax_then,function() { my_query.done.url=true; submit_if_done(); },0);
    }

    function npidb_promise_then(result) {
        console.log("npidb_promise_then,result="+result);
        my_query.npidb_url=result;
        //MTurk.queryList.push(result.replace(/\/$/,""));
        var promise=MTP.create_promise(result,parse_npidb,parse_npidb_then,function() { my_query.done.npidb=true; submit_if_done(); });
    }
    /* Parser for npidb.org doctor stuff */
    AggParser.parse_npidb=function(doc,url,resolve,reject) {
        console.log("parse_npidb, url="+url);
        var physDiv=doc.querySelector("[itemtype='http://schema.org/Physician']"),i,curr,text;
        var result={"success":true},term_list=["name","address","telephone","faxNumber"];
        if(!physDiv && (resolve({success:false})||true)) return;
        for(i=0;i<term_list.length;i++) {
            if((curr=doc.querySelector("[itemprop='"+term_list[i]+"']"))&&
               (text=curr.innerText.trim())&&text.length>0) result[term_list[i]]=text.replace(/\n+/g,",");
        }
        resolve(result);
    };
    function parse_npidb_then(result) {
        my_query.done.npidb=true;
        submit_if_done();
    }
    function providerdata_promise_then(result) {
        console.log("providerdata_promise_then,result="+result);
        my_query.npidb_url=result;
        //MTurk.queryList.push(result.replace(/\/$/,""));
        var promise=MTP.create_promise(result,parse_providerdata,parse_providerdata_then,
                                       function() { my_query.done.providerdata=true; submit_if_done(); });
    }
    function parse_providerdata(doc,url,resolve,reject) {
        console.log("parse_providerdata, url="+url);
        var fax=doc.querySelector(".contactFax");
        var result={"success":true,type:"providerdata"};
        if(fax) {
            result.fax=fax.innerText.replace(/^\s*Fax\s*:\s*/,"").trim();
            console.log("* Found fax="+my_query.fields.fax+" in parse_providerdata");
        }
        resolve(result);
    }
    function parse_providerdata_then(result) {
        my_query.done.providerdata=true;
        submit_if_done();
    }
    function npiprofile_promise_then(result) {
        console.log("npiprofile_promise_then,result="+result);
        my_query.npidb_url=result;
        //MTurk.queryList.push(result.replace(/\/$/,""));
        var promise=MTP.create_promise(result,parse_npiprofile,parse_site_then,function() { my_query.done.npiprofile=true; submit_if_done(); });
    }
    function parse_npiprofile(doc,url,resolve,reject) {
        console.log("parse_npiprofile, url="+url);
        var the_div=doc.querySelector("#npi-addresses");
        var match;
        var result={success:true,type:"npiprofile"};
       if(the_div && (match=the_div.innerText.match(/(?:(?:P:)|Phone\s*(?:[:]{1}?))\s*([\d\-\(\)\.\s]+)/i))) {
             console.log("* Found fax in find_fax,url="+url);
            result.phone=match[1].replace(/[\.\s]+$/g,"");
            console.log("* Found fax in parse_npiprofile,fax="+my_query.fields.fax);
            resolve("npiprofile");
            return;
        }
        if(the_div && (match=the_div.innerText.match(/(?:(?:F:)|Fax\s*(?:[:]{1}?))\s*([\d\-\(\)\.\s]+)/i))) {
             console.log("* Found fax in find_fax,url="+url);
            result.fax=match[1].replace(/[\.\s]+$/g,"");
            console.log("* Found fax in parse_npiprofile,fax="+my_query.fields.fax);
            resolve("npiprofile");
            return;
        }
        resolve("npiprofile");
    }
    function parse_site_then(result) {
        my_query.done[result]=true;
        submit_if_done();
    }

    function find_fax(doc,url,resolve,reject,depth) {
        var links=doc.links,i;
         var contact_regex=/(Contact)/i;
        var promise_list=[];
         var bad_contact_regex=/^\s*(javascript|mailto|tel):/i;
        if(my_query.fields.fax.length>0) {
            resolve("");
            return; }
        console.log("find_fax,url="+url+", MTurk.queryList="+JSON.stringify(MTurk.queryList));
        var text=doc.body.innerText,match;
        if((match=text.match(/(?:(?:F:)|Fax\s*(?:[:]{1}?))\s*([\d\-\(\)\.\s]+)/i))) {
             console.log("* Found fax in find_fax,url="+url);
            my_query.fields.fax=match[1].replace(/[\.\s]+$/g,"");
            console.log("* Found fax in find_fax,url="+url+",fax="+my_query.fields.fax);

            resolve("");
            return;
        }
        if(depth>=2) {
            console.log("Returning at depth="+depth);
            resolve("");
            return;
        }
        for(i=0;i<links.length;i++) {
            links[i].href=MTP.fix_remote_url(links[i].href,url).replace(/\/$/,"");
            if(!MTurk.queryList.includes(links[i].href) &&
               (contact_regex.test(links[i].innerText)||contact_regex.test(links[i].href)) &&
               !bad_contact_regex.test(links[i].href)) {
                MTurk.queryList.push(links[i].href);
                promise_list.push(MTP.create_promise(links[i].href,find_fax,MTP.my_then_func,MTP.my_catch_func,depth+1));
            }
        }
        Promise.all(promise_list).then(function() {
            console.log("Done promises on url="+url+", depth="+depth);
            resolve(""); });




    }
    function find_fax_then(result) {
        my_query.done.url=true;
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
        for(x in my_query.fields) if(field=document.getElementsByName(x)[0]) field.value=my_query.fields[x];
    }

    function submit_if_done() {
        console.log("in submit_if_done");
        var is_done=true,x,is_done_dones=true;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        for(x in my_query.fields) if(my_query.fields[x].length<5) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones) {
            console.log("Finished, nothing found, returning");
            GM_setValue("returnHit",true);
            return; }
    }

    function init_Query()
    {
        console.log("in init_query");
        bad_urls=bad_urls.concat(default_bad_urls);
        var strongs=document.querySelectorAll("form div div strong");
//        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
  //      var dont=document.getElementsByClassName("dont-break-out");
        my_query={name:strongs[0].innerText.replace(/\"/g,"").replace(/\s*\(.*$/,""),
                  street:strongs[1].innerText.replace(/\"/g,""),
                  city:strongs[2].innerText.replace(/\"/g,""),
                  state:strongs[3].innerText.replace(/\"/g,""),
                  fields:{fax:""},done:{"url":false,"npidb":false,"providerdata":false},
                  submitted:false,try_count:{}};
        my_query.short_name=MTP.shorten_company_name(my_query.name);

        for(var x in my_query.done) {
            my_query.try_count[x]=0; }
        console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+" "+my_query.city+" "+my_query.state;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"url");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.url=true; submit_if_done(); });
        const npidbPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" site:npidb.org", resolve, reject, query_response,"npidb");
        });
        npidbPromise.then(npidb_promise_then)
            .catch(function(val) {
            console.log("Failed at this npidbPromise " + val); my_query.done.npidb=true; submit_if_done(); });
        const provdataPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" site:providerdata.com", resolve, reject, query_response,"providerdata");
        });
        provdataPromise.then(providerdata_promise_then)
            .catch(function(val) {
            console.log("Failed at this provdataPromise " + val); my_query.done.providerdata=true; submit_if_done(); });
        const npiprofilePromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" site:npiprofile.com", resolve, reject, query_response,"npiprofile");
        });
        npiprofilePromise.then(npiprofile_promise_then)
            .catch(function(val) {
            console.log("Failed at this npiprofilePromise " + val); my_query.done.npiprofile=true; submit_if_done(); });

        //npiprofile.com
    }

})();