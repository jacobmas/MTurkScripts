// ==UserScript==
// @name         gerry gorman
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
    var bad_urls=["ballotpedia.org","spokeo.com",".lawyer.com","/opendatany.com","peekyou.com","/uslawyersdb.com","mylife.com",
                 ".peoplefinders.com","legaldirectories.com"];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A1PZCAZLCQLH6U",false);
    var MTP=MTurkScript.prototype;
    var lawyer_agg_domains=["attorneys.org","avvo.com","findlaw.com","find-lawyers-us.co","infoattorneys.com","justia.com",
                            "lawlink.com","lawyer.com",
                            "lawyerdb.org","lawyerlegion.com","law-firms.co","lawyers.com","lawyersattorneyguide.com",
                            "lawyersnearme.legal","legaldirectories.com","manta.com",
                            "mapquest.com","martindale.com","opendatany.com",
                           "superlawyers.com","prabook.com","spokeo.com","yelp.com","yellowpages.com","uslawyersdb.com"];
    function is_bad_name(b_name)
    {
        return false;
    }
    function is_lawyer_agg_domain(b_url) {
        var x;
        b_url=b_url.toLowerCase();
        let b_domain=MTP.get_domain_only(b_url,true);
        for(x of lawyer_agg_domains) {
            if(b_domain===x) return true;
        }
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
                console.log("parsed_context="+JSON.stringify(parsed_context));
            if(parsed_context.url && !MTP.is_bad_url(parsed_context.url,bad_urls,4,2)) {
                resolve(parsed_context.url);
                return;
            }
        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<5; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                if(!is_lawyer_agg_domain(b_url)) {
                    console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                }
                if(!is_lawyer_agg_domain(b_url) && !MTurkScript.prototype.is_bad_url(b_url, bad_urls,4,2) &&
                   !is_bad_name(b_name,my_query.name,p_caption,i)
		   && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        do_next_query(type,resolve,reject);
        return;
    }

    function do_next_query(type,resolve,reject) {
        if(/^query$/.test(type) && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            let search_str=my_query.fullname.fname+" "+my_query.fullname.lname+" lawyer "+(reverse_state_map[my_query.parsed_add.state]||"");
            query_search(search_str, resolve, reject, query_response,"query");
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
        console.log("Success, result="+result);
        my_query.firm_url=result;
        var dept_regex_lst=[];

        var title_regex_lst=[/Admin|Administrator|Supervisor|Manager|Director|Founder|Owner|Officer|Secretary|Assistant/i];
        //var promise=MTP.create_promise(
        var query={dept_regex_lst:dept_regex_lst,
                       title_regex_lst:title_regex_lst,id_only:false,default_scrape:false,debug:false};
        var gov_promise=MTP.create_promise(my_query.firm_url,Gov.init_Gov,gov_promise_then,function(result) {
            console.log("Failed at Gov "+result);
             },query);

    }

    function gov_promise_then(result) {
        console.log("gov_promise_then");
        var x,fullname;
        for(x of Gov.contact_list) {
            fullname=MTP.parse_name(x.name);
            if(fullname.lname===my_query.fullname.lname && MTP.matches_names(my_query.fullname.fname,fullname.fname)&&x.email!=="na") {
                my_query.fields.Q1Url=x.email;
                my_query.fields.Q3Url=x.url;
                add_to_sheet();
                return;
            }
        }
        for(x of Gov.email_list) {
            console.log("x="+JSON.stringify(x));
            if(x && !my_query.fields.Q1Url) {
                my_query.fields.Q1Url=x.email;
                my_query.fields.Q3Url=x.url;
                add_to_sheet();

            }
        }
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
            console.log("my_query.fields["+x+"]="+my_query.fields[x]);
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

    function add_only_aggregates() { add_bad("No web presence beyond aggregates"); }
    function add_bad(msg) {
        my_query.fields.Q1Url=my_query.fields.Q3Url="";
        my_query.fields.Q2Url=msg;
        add_to_sheet();
    }
    function add_old() { add_bad("Old, likely retired"); }
    function add_dead() { add_bad("Deceased"); }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        bad_urls=bad_urls.concat(default_bad_urls);
        var spans=document.querySelectorAll(".search p span");
        var my_style="'margin':'0px 10px','padding':'10px'";
        //var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        my_query={name:spans[0].nextElementSibling.innerText,firm:spans[1].nextElementSibling.innerText,
                  address:spans[2].nextElementSibling.innerText.replace(/^\s*,\s*/,""),
fields:{},
                  done:{},
                  try_count:{"query":0},
                  submitted:false};
        my_query.parsed_add=new Address(my_query.address);
        my_query.fullname=MTP.parse_name(my_query.name);
	console.log("my_query="+JSON.stringify(my_query));
        var fillplace=document.querySelector("#Q2Url").parentNode.nextElementSibling;
        var fill_button_lst=[],curr_btn,cb,cspan;
        var fill_par=document.createElement("div");
        var span_lst=[];
        var value_lst=[{value:"Only Aggregates",func:add_only_aggregates},{value:"Too Old",func:add_old},
                       {value:"Dead",func:add_dead}];


        for(curr_btn of value_lst) {
            cspan=document.createElement("span");
            cspan.style="margin:0px 15px 0px 0px";
            span_lst.push(cspan);
            cb=document.createElement("input");
            fill_button_lst.push(cb);
            Object.assign(cb,{type:"button",value:curr_btn.value,style:my_style});
            cspan.appendChild(cb);
            fill_par.appendChild(cspan);
            cspan.addEventListener("click",curr_btn.func);

        }


        fillplace.parentNode.insertBefore(fill_par,fillplace);
        var search_str=my_query.fullname.fname+" "+my_query.fullname.lname+" "+my_query.firm+" "+reverse_state_map[my_query.parsed_add.state];
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });
    }

})();
