// ==UserScript==
// @name         Natasha Nurjadin
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Parse SEC proxy etc. Code taken from Old/RichGentry.js
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
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,2000+(Math.random()*1000),[],begin_script,"A1VMCHSG94QUU5",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

    function query_response(response,resolve,reject,type) {
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
    function jacob_date_cmp(a,b) {

        if(a.priority!==b.priority) return b.priority-a.priority;
        else if(a.year!==b.year) return parseInt(b.year)-parseInt(a.year);
        else if(a.month!==b.month) return parseInt(b.month)-parseInt(a.month);
        else return parseInt(b.day)-parseInt(a.day);
    }
    /* Following the finding the district stuff */
    function query_promise_then(result) {
        my_query.date_lst.sort(jacob_date_cmp);
        console.log("my_query.date_lst="+JSON.stringify(my_query.date_lst));
        if(my_query.date_lst.length>0) {
            my_query.fields.Date=my_query.date_lst[0].name;
            submit_if_done();
        }
        else {
            console.log("Failed to find date, returning");
            GM_setValue("returnHit"+MTurk.assignment_id,true);
            return;
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
            console.log("x="+x+",my_query.fields["+x+"]="+my_query.fields[x]);
            if((MTurk.is_crowd && (field=document.getElementsByName(x)[0])) ||
               (!MTurk.is_crowd && (field=document.getElementById(x)))) field.value=my_query.fields[x];
        }
    }



    function set_unusual(is_unusual)
    {
        var inps=document.getElementsByTagName("input");
        var i;
        var rad_count=0;
        for(i=0; i < inps.length; i++)
        {
            if(inps[i].type==="radio")
            {
                if((rad_count==0 && is_unusual) || (rad_count==1 && !is_unusual)) inps[i].checked=true;
                rad_count++;
            }
        }
    }

    function check_and_submit()
    {

        console.log("Checking and submitting");

           if(GM_getValue("automate"))
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 500);
        }
    }
    function find_actual_def14a(doc,url,resolve,reject) {
        console.log("in find_actual_def14a,url="+url);
        var the_table=doc.querySelector("table.tableFile");
        var curr_row;

        for(curr_row of the_table.rows) {
            if(curr_row.cells.length>2&&
               (/DEF 14A|(^DEFINITIVE)/.test(curr_row.cells[1].innerText)||!/Description/.test(curr_row.cells[1].innerText))) {
                my_query.proxy_statement_url=MTP.fix_remote_url(curr_row.cells[2].querySelector("a").href,url);
                var promise=MTP.create_promise(my_query.proxy_statement_url,parse_proxy,resolve,reject);
                return;
            }
        }
        my_query.fields.Notes="NA";
        resolve("");
    }
    function find_company_SEC(doc,url,resolve,reject) {
        console.log("in find_company_SEC,url="+url);
        var the_table=doc.querySelector("table.tableFile2");
        if(!the_table) {
            my_query.fields.Notes="No Match";
            resolve("");
            return;
        }
        var curr_row;
        for(curr_row of the_table.rows) {
            if(curr_row.cells.length>1&&/DEF 14A/.test(curr_row.cells[0].innerText)) {
                my_query.def14a_url=MTP.fix_remote_url(curr_row.cells[1].querySelector("a").href,url);
                var promise=MTP.create_promise(my_query.def14a_url,find_actual_def14a,resolve,reject);
                return;
            }
        }
        console.log("FAILED TO FIND DEF 14A on "+url);
        if(the_table.length<3) my_query.fields.Notes="No Match";
        else my_query.fields.Notes="NA";
        resolve("");
    }
     function parse_proxy(doc,url,resolve,reject) {
         console.log("parse_proxy,url="+url);
         var the_divs=doc.querySelectorAll("div,p,td");
         the_divs.forEach(parse_proxy_div);
         resolve("");
     }
    function parse_proxy_div(elem) {
        if(elem.querySelector("div")) return;
        var text=elem.innerText.trim();
        if(!/proposal/i.test(text)) return;
        var month_re_str="(January|February|March|April|May|June|July|August|September|October|November|December)";
        var date_re_str=month_re_str+"\\s*([\\d]{1,2})\\s*,\\s*([\\d]{4})";
        var date_regex=new RegExp(date_re_str,"i");
        if(!date_regex.test(text)) return;
       // console.log("elem.innerText="+text);
        //console.log(text.match(date_regex));
        text=text.replace(/Inc\./g,"Inc").replace(/P\.O\./g,"PO").replace(/i\.e\./g,"ie").replace(/e\.g\./g,"eg");

        var regex_lst=[];

        regex_lst.push({re:new RegExp("(?:received by the secretary|secretary must receive|(?:receive (?:your|the) proposal)|(?:proposal(?:s)? must be (?:submitted|received)))"
                                      +"[^\.]*?"
                                      +date_re_str,"i"),priority:6});
        regex_lst.push({re:new RegExp("(?:received by the secretary|secretary must receive|(?:submit the (?:Rule 14a-8 )?proposal))[^\.]*?"
                                      +date_re_str,"i"),priority:6});
        regex_lst.push({re:new RegExp("(?:proposal must be received)[^]*?"
                                      +date_re_str,"i"),priority:6});
        regex_lst.push({re:new RegExp("(?:received by (?:[A-Za-z\\s]{0,25}) secretary)[^\.]*?"+date_re_str,"i"),priority:5});
         regex_lst.push({re:new RegExp("(?:shareholder|stockholder|shareowner) proposal(?:s)?[^\.]*?"+
                                       "(?:no later than|by)"+date_re_str,"i"),priority:9});

         regex_lst.push({re:new RegExp("(?:shareholder|stockholder|shareowner) proposal(?:s)?[^\.]*?"+date_re_str,"i"),priority:4});
        regex_lst.push({re:new RegExp("(?:receive it (?:no later than|by))\\s*"+date_re_str,"i"),priority:8})
        regex_lst.push({re:new RegExp("(?:must be received)[^\.]*?"
                                      +date_re_str,"i"),priority:1});
                regex_lst.push({re:new RegExp("(?:deadline to submit(?:[A-Za-z\\s]{0,25})proposal)[^\.]*?"
                                      +date_re_str,"i"),priority:3});

        regex_lst.push({re:new RegExp("(?:(?:included|inclusion) in (?:our )?Proxy (?:materials|Statement))[^\.]*?"+date_re_str,"i"),priority:7.5});

        regex_lst.push({re:new RegExp("(?:submit a proposal)[^\.\n]*?(?:proxy statement).*?"+date_re_str,"i"),priority:2});
        regex_lst.push({re:new RegExp("(?:received by the secretary|secretary must receive|(?:submit the (?:Rule 14a-8 )?proposal))[^]*?"
                                      +date_re_str,"i"),priority:1});

        //regex_lst.push(new RegExp(date_re_str,"i"));
        var match;
        var x;
        var additional_priority=0;
        if(/(?:shareholder|stockholder|shareowner) proposal/.test(text)) additional_priority++;
        if(/proxy (materials|statement)/.test(text)) additional_priority++;
        var bad_regexp=new RegExp("(?:held on|no earlier than|between|after)\\s+"+date_re_str,"i");
        for(x of regex_lst) {

            if((match=text.match(x.re))) {
                if(bad_regexp.test(match[0])) {
                   console.log("Bad match="+match[0]);
                    continue;
                }
                console.log("Matched (priority="+(x.priority+additional_priority)+") on \'"+match[0]+"\'");
                my_query.date_lst.push(new JacobDate(match[1],match[2],match[3],x.priority+additional_priority));
            }
        }
    }
    function JacobDate(month,day,year,priority) {
        var month_map={"01":/^Jan/,"02":/^Feb/,"03":/^Mar/,"04":/^Apr/,"05":/^May/,"06":/^Jun/,"07":/^Jul/,
                       "08":/^Aug/,"09":/^Sep/,"10":/^Oct/,"11":/^Nov/,"12":/^Dec/};
        var x;
        this.month_name=month;
        this.priority=priority;
        this.day=(day.toString().length===1?"0":"")+day;
        this.year=year;
        this.month="01";
        for(x in month_map) {
            if(month_map[x].test(this.month_name)) this.month=x;
        }
        this.name=this.year+"-"+this.month+"-"+this.day;
        this.toString=function() { this.year+"-"+this.month+"-"+this.day; };
    }

    function find_annual(response) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        //console.log("doc.body="+doc.body.innerHTML);

        var the_table=doc.getElementsByClassName("tableFile2");
        if(the_table===undefined || the_table.length===0)
            the_table=doc.getElementsByClassName("tableFile");
       //console.log("the_table[0].innerHTML="+the_table[0].innerHTML);
        var i;
        for(i=0; i < the_table[0].rows.length; i++)
        {
            console.log("the_table[0].rows["+i+"].cells[0]="+the_table[0].rows[i].cells[0].innerText);
            if(the_table[0].rows[i].cells[0].innerText==="10-K" || the_table[0].rows[i].cells[0].innerText==="10-K405")
            {
                var my_link=the_table[0].rows[i].cells[1].firstChild;
                // console.log(my_link.href);
                //.firstChild;
                var url="";
                if(my_link.href!==undefined)
                {
                    url=my_link.href.toString().replace("https://s3.amazonaws.com","https://www.sec.gov");
                    // my_query.url=url;
                    console.log("url="+url);
                }
                else {
                    console.log("Failed to find url in annual1");
                    GM_setValue("returnHit",true);
                    return;
                }


                GM_xmlhttpRequest({
                    method: 'GET',
                    url:    url,

                    onload: function(response) {
                        find_annual2(response);
                        //    bing1_response(response, my_query);

                    }

                });

                return;
            }
        }

        GM_setValue("returnHit",true);

    }
    function find_annual2(response) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        //console.log("doc.body="+doc.body.innerHTML);

        var the_table=doc.getElementsByClassName("tableFile");
        if(the_table===undefined || the_table.length===0)
            the_table=doc.getElementsByClassName("tableFile2");
        //console.log("the_table[0].innerHTML="+the_table[0].innerHTML);
        var my_link=the_table[0].rows[1].cells[2].firstChild;
       // console.log(my_link.href);
        //.firstChild;
        var url="";
        if(my_link.href!==undefined)
        {
            url=my_link.href.toString().replace("https://s3.amazonaws.com","https://www.sec.gov");
            my_query.annual_url=url;
            console.log("url="+url);
        }
        else {
            console.log("Failed to find url in annual2");
            GM_setValue("returnHit",true);
            return;
        }


        GM_xmlhttpRequest({
            method: 'GET',
            url:    url,

            onload: function(response) {
                parse_annual(response);
            //    bing1_response(response, my_query);

            }

        });
    }
    function parse_annual(response) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("doc.body.innerText="+doc.body.innerText);

         var fiscal_ended_re=new RegExp("fiscal year ended "+my_query.end_month+"[^\w]"+my_query.end_day+",[^\w]"+my_query.end_year);
         console.log("fiscal_ended_re="+fiscal_ended_re);
         var fiscal_re_ended_match=doc.body.innerText.match(fiscal_ended_re);


         if(fiscal_re_ended_match===null)
         {
             console.log("match null in annual");
             set_unusual(false);
         }
       else
       {
           console.log("matched ended in annual");
       }



         document.getElementsByName("citation")[0].value=my_query.annual_url;



         check_and_submit();

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
        var i,re=/([^:]*):(.*)$/,match;

        var input_fields=document.querySelectorAll("form div div p");
        my_query={ticker:input_fields[0].innerText.match(re)[2].replace(/[\/]/g,"").trim(),
                  name:input_fields[1].innerText.match(re)[2].trim(),fields:{Notes:""},
                  done:{},date_lst:[],
                  submitted:false};
        console.log("my_query="+JSON.stringify(my_query));
        my_query.ticker_url="https://www.sec.gov/cgi-bin/browse-edgar?CIK="+my_query.ticker+"&owner=exclude&action=getcompany&count=100";
        var promise=MTP.create_promise(my_query.ticker_url,find_company_SEC,query_promise_then,function() {

            GM_setValue("returnHit"+MTurk.assignment_id,true); });
    }

})();
