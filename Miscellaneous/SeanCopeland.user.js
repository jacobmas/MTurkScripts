// ==UserScript==
// @name         SeanCopeland
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
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,200,[],begin_script,"A9KNE9LPIW2XD",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
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
            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption="";
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                }
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls,-1) && !is_bad_name(b_name))
                {
                    b1_success=true;
                    break;

                }

            }
            if(b1_success)
            {
                /* Do shit */
                resolve(b_url);
                return;
            }
        }
        catch(error)
        {
            reject(error);
            return;
        }
        resolve(my_query.fields.newURL);
        //        GM_setValue("returnHit",true);
        return;

    }
    var month_map={"01":/^Jan[a-z]*/,"02":/^Feb[a-z]*/,"03":/^Mar[a-z]*/,"04":/^Apr[a-z]*/,"05":/^May/,"06":/^Jun[a-z]*/,"07":/^Jul[a-z]*/,
                   "08":/^Aug[a-z]*/,"09":/^Sep[a-z]*/,"10":/^Oct[a-z]*/,"11":/^Nov[a-z]*/,"12":/^Dec[a-z]*/};

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        my_query.fields.newURL=result;
        var domain=MTP.get_domain_only(result),promise;
        set_fields_by_domain(domain);
        add_to_sheet();
        var i;
        var parser_list=[{regex:/usask\.ca/,url:"https://students.usask.ca/money/awards/undergraduate-awards.php",parser:begin_sask},
                         {regex:/athabascau\.ca/,url:"http://registrar.athabascau.ca/studentawards/alpha.php",parser:parse_athabascau},
                         {regex:/uvic\.ca/,url:result,parser:parse_uvic},{regex:/alberta\.ca/,url:my_query.url,parser:begin_alberta},
                        {regex:/cotr\.bc\.ca/,url:result,parser:parse_cotr},{regex:/concordia\.ab\.ca/,url:result,parser:parse_concordia_ab},
                         {regex:/stu\.ca/,url:result,parser:parse_stu}];
        for(i=0;i<parser_list.length;i++) {
            if(parser_list[i].regex.test(domain) && ((promise=MTP.create_promise(parser_list[i].url,parser_list[i].parser,parse_promise_then))||1)) return;
        }

        //promise=MTP.create_promise(my_query.fields.newURL,parse_award,parse_promise_then,domain);
    }
    function parse_stu(doc,url,resolve,reject) {
        console.log("parse_stu,url="+url);
        var listings=doc.querySelectorAll(".stu-scholarship-listings"),match,h3,i,val_match;
        for(i=0;i<listings.length;i++) {
            h3=listings[i].querySelector("h3");
            if(MTP.matches_names(my_query.name,h3)) {
                if((val_match=text.match(/Value:\s*(.*)$/))) my_query.fields.awardValue=val_match[1];
                break; }

        }
       if(/Scholarship$/.test(my_query.name)) my_query.fields.endsAt="03/01/2019";
        else if(/Bursary$/.test(my_query.name)) my_query.fields.endsAt="10/31/2019";
        add_to_sheet();

    }
    function parse_concordia_ab(doc,url,resolve,reject) {
        console.log("concordia_ab,url="+url);
        var content=doc.querySelector(".page-content p"),text="",val_match,date_match,date_str="",x;
        if(!content) return;
        else text=content.innerText;
        if((val_match=text.match(/Value:\s*(.*)$/))) my_query.fields.awardValue=val_match[1];
        if((date_match=text.match(/Application Deadline:\s*([A-Za-z])+\s([\d]+),\s*([\d]+)/))) {
            for(x in month_map) { if(month_map[x].test(date_match[1])) date_str=date_str+x+"/"; }
            if(date_str.length>0) my_query.fields.endsAt=date_str+date_match[2]+"/"+date_match[3];

        }
        add_to_sheet();
    }


    function begin_alberta(doc,url,resolve,reject) {
        var a_lst=doc.querySelectorAll(".scholarshipContent a"),i,promise,match;
        my_query.fields.endsAt="08/01/2019";
        for(i=0;i<a_lst.length;i++) {
            if(MTP.matches_names(my_query.name,a_lst[i].innerText)&&(match=a_lst[i].href.match(/\?.*$/,""))) {
                promise=MTP.create_promise("https://studentaid.alberta.ca/scholarships/alberta-scholarships/"+match[0],
                                           parse_alberta,resolve,reject);
                break;
            }
        }
        add_to_sheet();
    }


    function parse_alberta(doc,url,resolve,reject) {
        console.log("in parse_alberta, url="+url);
        var inner_p=doc.querySelectorAll(".scholarshipContent p"),i,next_p,match;
        for(i=0;i<inner_p.length;i++) {
            if(/Value:/.test(inner_p[i].innerText) && (next_p=inner_p[i].nextElementSibling) && next_p.tagName==="P") {
                if(match=next_p.innerText.match(/\$[\d,]+/)) my_query.fields.awardValue=match[0];
            }
        }
        add_to_sheet();
    }

    function parse_cotr(doc,url,resolve,reject) {
        var content=doc.querySelector("#content"),match;
        my_query.fields.newURL=url;
        if(match=content.innerText.match(/\$[\d,]+/)) my_query.fields.awardValue=match[0];
        add_to_sheet();
    }
    function parse_uvic(doc,url,resolve,reject) {
        var h3=doc.querySelectorAll("h3"),i,div,match;
        my_query.fields.newURL=url;
        for(i=0;i<h3.length;i++) {
            if(MTP.matches_names(my_query.name,h3[i].innerText.trim().replace(/\*$/,"")) && (div=h3[i].nextElementSibling)) {
                if((match=div.innerText.match(/Value:\s*([^\|\n]+)/i))) my_query.fields.awardValue=match[1];
                break; }
        }
        add_to_sheet();
    }
    function parse_athabascau(doc,url,resolve,reject) {
        my_query.fields.newURL=url;
        var awardInfo=doc.querySelectorAll(".awardInfo"),i,title,table,row,j,k,date_str,value_str,match,match2;
        for(i=0;i<awardInfo.length;i++) {
            title=awardInfo[i].querySelector("h4");
            if(title&& MTP.matches_names(my_query.name,title.innerText) && (table=awardInfo[i].querySelector("table"))) {
                for(j=0;j<table.rows.length;j++) {
                    row=table.rows[j];
                    console.log("row["+j+"]="+row.innerText);
                    if(row.cells.length>=1&&(match=row.cells[0].innerText.match(/^\s*Value:\s*(.*)$/i)) && (match2=match[1].match(/\$[\d,]+/))) {
                        my_query.fields.awardValue=match2[0]; }
                    if(row.cells.length>=2&&(/ANNUAL APPLICATION/i.test(row.cells[0].innerText))) {
                        parse_month_day(row.cells[1].innerText.trim()); }
                }
                break;
            }
        }
        add_to_sheet();
    }

    function parse_month_day(text) {
        var split_text=text.split(" ");
        console.log("split_text="+split_text+", len="+split_text.length);
        var x,match,date_str="";
        if(split_text.length===2) {
            for(x in month_map) if((match=split_text[0].match(month_map[x])) && (date_str=date_str+x+"/")) break;
            if(date_str.length>0) date_str=date_str+(split_text[1].length<2?"0":"")+split_text[1]+"/2019";
            if(date_str.length>0) my_query.fields.endsAt=date_str;
        }
    }

    function begin_sask(doc,url,resolve,reject) {
        var headers={"Content-Type": "application/x-www-form-urlencoded","host":"students.usask.ca",
                     "origin":"https://students.usask.ca",
                     "referer":"https://students.usask.ca/money/awards/undergraduate-awards.php"};
        var new_url="https://students.usask.ca/money/awards/undergraduate-awards.php";
        var data_str="search_keywords=%22"+my_query.name.replace(/\s/g,"+")+"%22&college=&category=&application=&award_type=&sort_col=name&sort_dir=asc&_showresults=";
        console.log("data_str="+data_str);

        GM_xmlhttpRequest({method: 'POST', url: new_url,data:data_str,headers:headers,
                           onload: function(response) {  console.log("response="+JSON.stringify(response));
                               var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                               parse_sask_results(doc,response.finalUrl,resolve,reject); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
    }
    function parse_sask_results(doc,url,resolve,reject) {
        var table=doc.querySelector("#myScholarships table"),i,row,begin_url="https://students.usask.ca/money/awards/undergraduate-awards.php";
        var match,a,date_str="",x,split_text;
        if(!table) return;
        for(i=1;i<table.rows.length;i++) {
            row=table.rows[i];
            if(row.cells.length>=3&&(a=row.cells[0].querySelector("a"))) {
                if((match=a.href.match(/\?.*$/,""))) my_query.fields.newURL=begin_url+match[0];
                parse_month_day(row.cells[1].innerText);
                my_query.fields.awardValue=row.cells[2].innerText;
                break;
            }
        }
        console.log("my_query.fields="+JSON.stringify(my_query.fields));
        add_to_sheet();
    }

    function set_fields_by_domain(domain) {
        if(/uvic\.ca/.test(domain)) my_query.fields.endsAt="05/31/2019";
        if(/cotr\.bc\.ca/.test(domain)) my_query.fields.endsAt="03/31/2019";
        if(/langara\.bc\.ca/.test(domain)) my_query.fields.endsAt="01/25/2019";
        if(/laurentian\.ca/.test(domain)) { my_query.fields.endsAt="06/01/2019"; my_query.fields.awardValue="Varies"; }
    }
    function parse_award(doc,url,resolve,reject,domain) {
        console.log("in parse_promise_then, url="+url);

    }
    function parse_promise_then(result) {
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
            if(field=document.getElementsByName(x)[0]) {
                field.type="text";
                field.value=my_query.fields[x].trim();

                field.required=false;
            }
        }
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var div=document.querySelectorAll("div"),inner_p;

       var url=document.querySelector("form a");
        my_query={name:"",url:url.href,fields:{awardFound:"Yes",newURL:"",awardValue:"",endsAt:""},done:{},submitted:false};
        my_query.fields.newURL=my_query.url;
        for(i=0;i<div.length;i++) {
            inner_p=div[i].querySelectorAll("p");
            if(inner_p.length>1 && /Name of the Award/.test(inner_p[0].innerText)) {
                my_query.name=inner_p[1].innerText; }
        }
        my_query.name=my_query.name.replace(/, The\s*/,"").replace(/\s*\(.*$/,"");
        my_query.domain=MTP.get_domain_only(my_query.url,true);
        add_to_sheet();
        console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+" site:"+my_query.domain;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }

})();