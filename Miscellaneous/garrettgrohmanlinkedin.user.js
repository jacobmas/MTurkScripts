// ==UserScript==
// @name         garrettgrohmanlinkedin
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  LinkedIn
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/24856fc33aa0dad5596dc9e2be19813db2f42f32/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,1250+(Math.random()*1000),[],begin_script,"A3HCLXMAAEOCYG",false);
    var MTP=MTurkScript.prototype;

    function is_bad_name(b_name,p_caption,i)
    {
        var reg=/[-\s\'\"’]+/g,b_replace_reg=/\s+[\-\|–]{1}.*$/g;
        var lower_b=b_name.toLowerCase().replace(reg,""),lower_my=my_query.company.replace(/\s(-|@|&|and)\s.*$/).toLowerCase().replace(reg,"");
        if(lower_b.indexOf(lower_my)!==-1 || lower_my.indexOf(lower_b)!==-1) return false;
        b_name=b_name.replace(b_replace_reg,"");
        my_query.company=my_query.company.replace("’","\'");
        console.log("b_name="+b_name+", my_query.company="+my_query.company);
        if(MTP.matches_names(b_name,my_query.company)) return false;
        if(i===0 && b_name.toLowerCase().indexOf(my_query.company.split(" ")[0].toLowerCase())!==-1) return false;
        return true;
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
            if((b_context=doc.getElementById("b_context"))&&(parsed_context=MTP.parse_b_context(b_context))) {

             //   console.log("b_context="+b_context.innerHTML);
                console.log("parsed_context="+JSON.stringify(parsed_context));
                if(/company/.test(type) && parsed_context.url && !MTP.is_bad_url(parsed_context.url,bad_urls,-1) &&
                   (resolve(parsed_context.url)||true)) return;
                if(/query/.test(type) && parsed_context.people&&!parsed_context.person) {
                    console.log("### parsed_context.people");
                    if(!my_query.found_good && found_good_person(parsed_context.people,my_query.fullname,resolve,reject,"query")) return;
                }
                if(type==="query" && parsed_context.person&&parsed_context.person.experience) {
                    console.log("parsed_context.person");
                    if(parsed_context.person.experience.length>0) {
                        my_query.company=parsed_context.person.experience[0].company.replace(/\-/g," ");
                        resolve("");
                        return;
                    }
                }
            }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                if(/company/.test(type) && parsed_lgb.url && !MTP.is_bad_url(parsed_lgb.url,bad_urls,-1) &&
                   (resolve(parsed_lgb.url)||true)) return;
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(/query/.test(type) && b_url===my_query.linkedin_url && my_query.try_count[type]===0) {
                    my_query.try_count[type]++;
                    let temp_b_name=b_name.replace(/[\-\|]*\s*LinkedIn$/,"").replace(/\.\.\.$/,"");
                    query_search(temp_b_name, resolve, reject, query_response,"query");
                    return;
                }
                if(/company/.test(type) && !MTurkScript.prototype.is_bad_url(b_url, bad_urls,4,2) && !is_bad_name(b_name,p_caption,i)
                   && (b1_success=true)) break;

            }
            if(/company/.test(type) && b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        reject("Nothing found");
        return;
    }

    function found_good_person(people,full,resolve,reject,type) {
        let curr_person;
        for(curr_person of people) {
            //console.log("state_map[my_query.state]="+state_map[my_query.state]);
            curr_person.name=curr_person.name.replace(/,.*$/,"").replace(/\s*\([^\)]*\)/g,"").trim();
            console.log("curr_person.name="+curr_person.name);
            let full=MTP.parse_name(curr_person.name.trim());
          //  console.log("@ full="+JSON.stringify(full)+", my_query.fullname="+JSON.stringify(my_query.fullname));
            if(true) {
                console.log("url="+curr_person.url);
                var search_str=decodeURIComponent(curr_person.url.match(/\?q\=([^&]*)&/)[1]).replace(/\+/g," ");
                console.log("### Found good person ");
                my_query.found_good=true;
                var filters=curr_person.url.match(/&filters\=([^&]*)/)[1];
                query_search(search_str,resolve,reject,query_response,type,filters);
//                var promise=MTP.create_promise(curr_person.url,query_response,resolve,reject,type);
               return true;
            }
        }
        return false;
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
        console.log("query_promise_then,result="+result);
        const companyPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.company, resolve, reject, query_response,"company");
        });
        companyPromise.then(company_promise_then)
            .catch(function(val) {
            console.log("Failed at this companyPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });

    }

    function company_promise_then(result) {
        console.log("company promise then, result="+result);
        my_query.fields.web_url=result;
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
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        bad_urls=bad_urls.concat(default_bad_urls);

        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.querySelector(".dont-break-out");
        my_query={name:wT.rows[0].cells[1].innerText,title:wT.rows[2].cells[1].innerText.trim(),
            linkedin_url:wT.rows[3].cells[1].innerText.replace(/\/$/,""),fields:{web_url:""},
                  done:{},submitted:false,found_good:false,try_count:{"query":0},tried_again:false};
        my_query.fullname=MTP.parse_name(my_query.name);
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.linkedin_url;
        if(/(?:for|at) [A-Z]{1}/.test(my_query.title)) {
            my_query.company=my_query.title.match(/(?:for|at) ([A-Z]{1}.*)$/)[1].replace(/\s[\-\|,].*$/,"");
            query_promise_then();
            return;
        }
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });
    }

})();