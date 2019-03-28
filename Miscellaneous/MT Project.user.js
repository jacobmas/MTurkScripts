// ==UserScript==
// @name         MT Project
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Doctor health
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
// @connect npiregistry.cms.hhs.gov
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
    var MTurk=new MTurkScript(20000,200,[],begin_script,"A1D3XHIK4LPPBM");
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
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !is_bad_name(b_name))
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
        reject("Nothing found");
        //        GM_setValue("returnHit",true);
        return;

    }

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
    function parse_npi(doc,url,resolve,reject) {
        var name_field=doc.querySelector(".row-fluid p");
        var name_str=name_field.innerText.trim().replace(/M\.?D\.?\s*$/,"").trim();
        var fullname=MTP.parse_name(name_str),gender_field=doc.querySelector(".row-fluid .style1");
        var table=doc.querySelector(".well table"),row,i,j,label,curr_str,value,split_lines,tax_table;


        my_query.fields["Q1first"]=fullname.fname;
        my_query.fields["Q2middle"]=fullname.mname;
        my_query.fields["Q3last"]=fullname.lname;
        my_query.fields["Q5gender"]=gender_field.innerText.trim().replace("Gender:","").trim();
        for(i=1;i<table.rows.length;i++) {
            row=table.rows[i];
            label=row.cells[0].innerText.trim();
            value=row.cells[1].innerText.trim();
            curr_str="";
            if(/Practice Address/.test(label)) {
                split_lines=value.replace(/\t/g,"").split("\n");
                console.log("split_lines ("+i+")="+JSON.stringify(split_lines));
                for(j=0;j<split_lines.length && !/Phone:/.test(split_lines[j].trim());j++) {
                    if(split_lines[j].trim().length===0) continue;
                    curr_str=curr_str+(curr_str.length>0?",":"")+split_lines[j]; }
            }
            if(/Primary Practice Address/.test(label)) my_query.fields.Q7hospitalAddress1=curr_str;
            else if(/Secondary Practice Address/i.test(label)) my_query.fields.Q9hospitalAddress2=curr_str;
            if(/Taxonomy/.test(label) && (tax_table=row.cells[1].querySelector("table"))) {
                get_taxonomy(tax_table);
            }
        }
        add_to_sheet();

    }
    function get_taxonomy(table) {
        var row,i,primary,tax;
        for(i=1;i<table.rows.length;i++) {
            row=table.rows[i];
            primary=row.cells[0].innerText.trim();
            tax=row.cells[1].innerText.trim();
            if(/Yes/.test(primary)) {

                my_query.fields.Q4specialty=tax.replace(/^[^-]*-\s*/,"").trim();
            }
        }
    }



    function add_to_sheet() {
        var x,field;
        for(x in my_query.fields) if(field=document.getElementById(x)) field.value=my_query.fields[x];
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
        var form=document.getElementById("mturk_form");
        var country_reg=/Doctor Country:\s*([a-z]*)/,id_reg=/Doctor ID:\s*([\d]*)/,promise;
        var match_country=form.innerText.match(country_reg), match_id=form.innerText.match(id_reg);
        my_query={country:match_country[1],id:match_id[1],fields:{},done:{},submitted:false};
        if(/us/.test(my_query.country)) {
            promise=MTP.create_promise("https://npiregistry.cms.hhs.gov/registry/provider-view/"+my_query.id,parse_npi,query_promise_then);
        }
    }

})();