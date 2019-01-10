// ==UserScript==
// @name         Kristin
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Collect Phone, Owner, a General Please Add
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
    var MTurk=new MTurkScript(20000,200,[],begin_script,"A14RLHAFGELCFG",false);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name,site)
    {
        var loc="",match;
        var city="",state;
        if(site==="buzzfile.com" || site==="bizapedia.com") {
            match=b_name.match(/^(.*)\sin\s([^,]+),\s*([^\-\|]+)/);
            if(match) {
                console.log("match="+match);
                b_name=MTP.shorten_company_name(match[1]);
                city=match[2];
                state=match[3];
                if(my_query.location.indexOf(match[3].trim())<=0) {
                    console.log("my_query.location="+my_query.location+", match[3]="+match[3].trim());
                    return true;
                }
                console.log("BLUNK");
            }
        }

        if(MTP.matches_names(b_name,MTP.shorten_company_name(my_query.name))) {
                    console.log(site+": Match b_name="+b_name+", short_name="+MTP.shorten_company_name(my_query.name));

            return false;
        }

        console.log(site+": No match b_name="+b_name+", short_name="+MTP.shorten_company_name(my_query.name));
        if(city.length>0&&my_query.location.toLowerCase().indexOf(city.toLowerCase())!==-1&&b_name.indexOf(my_query.name.replace(/\s.*$/,""))!==-1) return false;
        return true;
    }

    function query_response(response,resolve,reject,site) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", site="+site);
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
            for(i=0; i < b_algo.length&&i<3; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!is_bad_name(b_name,site) && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
       if(my_query.try_count[site]!==undefined&& my_query.try_count[site]===0) {
            my_query.try_count[site]++;
            query_search(my_query.name+" site:"+site,resolve,reject,query_response,site);
           return;

        }
        console.log("Nothing found via "+site);
        my_query.done[site.replace(/\..*$/,"")]=true;
        submit_if_done();
        return;
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,site) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,site); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function buzzfile_promise_then(result) {
        my_query.buzzfile_url=result;
        var promise=MTP.create_promise(my_query.buzzfile_url,parse_buzzfile,parse_buzzfile_then);
    }

    function parse_buzzfile(doc,url,resolve,reject) {
        var div=doc.querySelector("[itemtype='https://schema.org/Organization']");
        var result={success:true};
        if(!div) resolve({success:false});
        var term_map={"employee":"name","contactType":"title","telephone":"phone"};
        var curr_item,x;
        for(x in term_map) {
            if(curr_item=div.querySelector("[itemprop='"+x+"']")) result[term_map[x]]=curr_item.innerText.trim(); }
         console.log("parse_buzzfile, result="+JSON.stringify(result));
        resolve(result);

    }

    function parse_buzzfile_then(result) {
        my_query.done.buzzfile=true;
        if(result.success) {
            my_query.fields.phone=result.phone;
            my_query.fields.name=result.name+", "+result.title;
        }
        submit_if_done();
    }

    function bizapedia_promise_then(result) {
        my_query.bizapedia_url=result;
        var promise=MTP.create_promise(my_query.bizapedia_url,parse_bizapedia,parse_bizapedia_then);
    }

    function parse_bizapedia(doc,url,resolve,reject) {
        console.log("in parse_bizapedia, url="+url);
        var table=doc.querySelector("table[itemtype='https://schema.org/Person']");
        var result={success:true};
        console.log("table="+table);
        if(!table || table.rows.length<3) resolve({success:false});
        result={name:table.rows[0].innerText.trim(),title:table.rows[2].innerText.trim(),success:true};
        console.log("parse_bizapedia, result="+JSON.stringify(result));
        resolve(result);

    }

    function parse_bizapedia_then(result) {

        my_query.done.bizapedia=true;
        if(result.success) {
            my_query.fields.name=result.name+", "+result.title;
        }
        submit_if_done();
    }

     function dandb_promise_then(result) {
        my_query.dandb_url=result;
        var promise=MTP.create_promise(my_query.dandb_url,parse_dandb,parse_dandb_then);
    }

    function parse_dandb(doc,url,resolve,reject) {
        console.log("in parse_dandb, url="+url);
        var tel=doc.querySelector(".tel");
        var result={success:true},i,span;
        if(tel) result.phone=tel.innerText.trim();
        var bus_lst=doc.querySelectorAll(".business li");
        for(i=0;i<bus_lst.length;i++) {
            if(/Contacts/.test(bus_lst[i].innerText) && (span=bus_lst[i].querySelector("span"))) {
                result.name=span.innerText.trim();
                result.title="Owner"; }
        }
        console.log("parse_dandb, result="+JSON.stringify(result));

        resolve(result);

    }

    function parse_dandb_then(result) {
        my_query.done.dandb=true;
        if(result.success) {
            if(result.phone) my_query.fields.phone=result.phone;
            if(result.name && result.title) {
                my_query.fields.name=result.name+", "+result.title; }
        }
        submit_if_done();
    }

    function fb_promise_then(result) {
        var x;
        my_query.buzzfile_url=result;
        var promise=MTP.create_promise(my_query.buzzfile_url,MTP.parse_FB_home,parse_FB_then);
    }

    function parse_FB_then(result) {
        console.log("result="+JSON.stringify(result));
        if(result.phone && my_query.fields.phone.length===0) my_query.fields.phone=result.phone.trim();
        my_query.done.facebook=true;
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
        for(x in my_query.fields) if(field=document.getElementById(x)) field.value=my_query.fields[x];
    }

    function submit_if_done() {
        var is_done=true,x,is_done_dones;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        for(x in my_query.fields) if(my_query.fields[x].length===0) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones) {
            if(!my_query.tried_phone && my_query.fields.name.length>0) {
                my_query.tried_phone=true;

            }
            console.log("Returning");
            GM_setValue("returnHit",true); }
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        my_query={name:wT.rows[0].cells[1].innerText,location:wT.rows[1].cells[1].innerText,fields:{phone:"",name:""},
                  done:{"buzzfile":false,"facebook":false,"bizapedia":false,"dandb":false},submitted:false
                  ,try_count:{"buzzfile.com":0,"bizapedia.com":0},tried_phone:false};
	console.log("my_query="+JSON.stringify(my_query));
        my_query.name=MTP.shorten_company_name(my_query.name.replace(/\s+[-\[\(]+.*$/,""));
        var search_str=my_query.name+" "+my_query.location+" site:buzzfile.com";
        const buzzfilePromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"buzzfile.com");
        });
        buzzfilePromise.then(buzzfile_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
       const fbPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            search_str=my_query.name+" "+my_query.location+" site:facebook.com";
            query_search(search_str, resolve, reject, query_response,"facebook.com");
        });
       fbPromise.then(fb_promise_then)
            .catch(function(val) {
            console.log("Failed at this fbPromise " + val); GM_setValue("returnHit",true); });
        const bizapediaPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            search_str=my_query.name+" "+my_query.location+" site:bizapedia.com";
            query_search(search_str, resolve, reject, query_response,"bizapedia.com");
        });
        bizapediaPromise.then(bizapedia_promise_then)
            .catch(function(val) {
            console.log("Failed at this bizapediaPromise " + val); GM_setValue("returnHit",true); });
        const dandbPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            search_str=my_query.name+" "+my_query.location+" site:dandb.com";
            query_search(search_str, resolve, reject, query_response,"dandb.com");
        });
        dandbPromise.then(dandb_promise_then)
            .catch(function(val) {
            console.log("Failed at this dandbPromise " + val);
            my_query.done.dandb=true;
            submit_if_done();
        });
        const chamberPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            search_str=my_query.name+" "+my_query.location+" site:chamberofcommerce.com";
            query_search(search_str, resolve, reject, query_response,"chamberofcommerce.com");
        });
        chamberPromise.then(chamber_promise_then)
            .catch(function(val) {
            console.log("Failed at this chamberPromise " + val);
            my_query.done.chamber=true;
            submit_if_done();
        });
    }

})();