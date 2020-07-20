// ==UserScript==
// @name         MODIFI_northdata
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Scrape northdata, CANNOT DO automated because of fraud prevention
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
// @connect northdata.de
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,5000+(Math.random()*1000),[],begin_script,"A1MT0G0JFCSPG8",true);
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
                console.log("parsed_context="+JSON.stringify(parsed_context));
            if(parsed_context.Title) {
                resolve(parsed_context.Title);
                return;
            }
        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if((true||(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !is_bad_name(b_name))) && (b1_success=true)) break;
            }
            b_name=b_name.replace(/^(Welcome|Start |Home[a-z]*).*?\s[\-\|]/,"");
            if(b1_success && (resolve(b_name.replace(/\s[\-\|].*$/,""))||true)) return;
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
    function my_query_promise_then(result) {
        var temp_name=result;
        my_query.temp_name=result;
        my_query.json_url="https://www.northdata.de/search.json?query="+encodeURIComponent(my_query.name.replace(/\&.*$/,""));
        	console.log("my_query="+JSON.stringify(my_query));

        var promise=MTP.create_promise(my_query.json_url,parse_json,query_promise_then,try_temp_name);
    }

    function try_temp_name() {
        console.log("## Trying temp_name="+my_query.temp_name);
        my_query.name=my_query.temp_name;
         my_query.json_url="https://www.northdata.de/search.json?query="+encodeURIComponent(my_query.name);
        	console.log("my_query="+JSON.stringify(my_query));

        var promise=MTP.create_promise(my_query.json_url,parse_json,query_promise_then,fail_function);
    }


    /* Following the finding the district stuff */
    function query_promise_then(result) {
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
    function parse_json(doc,url,resolve,reject,response) {
        var parsed=JSON.parse(response.responseText);
          var json_promise;
         try {
             //console.log("response.responseText="+response.responseText);
             //console.log("parsed.items.length="+parsed.results.length);
             if(parsed.results.length===0) {
                 reject("");
                 return;
             }
             console.log("parsed="+JSON.stringify(parsed.results));
             console.log("parsed[0]="+JSON.stringify(parsed.results[0].company));
             for(let x in parsed.results[0]) {
                 console.log("x="+x);
             }
             my_query.company_url=parsed.results[0].company.northDataUrl;
             my_query.fields.url=my_query.company_url;
             console.log("my_query.company_url="+my_query.company_url);
             var promise=MTP.create_promise(my_query.company_url,parse_company,resolve,reject);
         }
         catch(error) {
             console.log("error in parse_json "+error);
             if(my_query.try_count.json===0) {
                 my_query.try_count.json++;
                 my_query.name=my_query.name.replace(/\s+GmbH(\s|$).*$/,"");
                   my_query.json_url="https://www.northdata.de/search.json?query="+encodeURIComponent(my_query.name);
                 json_promise=MTP.create_promise(my_query.json_url,parse_json,query_promise_then,fail_function);
                 return;
             }
             else if(my_query.try_count.json===1) {
                 my_query.try_count.json++;
                 my_query.name=my_query.name.replace(/ und /g," & ");
                 my_query.json_url="https://www.northdata.de/search.json?query="+encodeURIComponent(my_query.name);
                 json_promise=MTP.create_promise(my_query.json_url,parse_json,query_promise_then,fail_function);
                 return;
             }

             my_query.fields["on Northdata"]="No";
             GM_setValue("returnHit"+MTurk.assignment_id,true);
//             resolve("");
         }


    }
    function parse_company(doc,url,resolve,reject) {
        console.log("parse company, url="+url);
        var german_english_map={"Gewinn":"Profit","Umsatz":"Revenue","Bilanzsumme":"Assets"};
        var labels=doc.querySelectorAll(".stackable .column p");
        if(labels.length>=2) my_query.fields["Company ID"]=labels[1].innerText.trim().replace(/vormals:[^]*$/,"").trim();
        else {
            console.log("FRAUD DETECTED");
            alert("FRAUD DETECTED");
            GM_setValue("automate",false);
            return;
        }
        var charts=doc.querySelector(".has-bar-charts");
        console.log("charts="+JSON.stringify(charts));
        if(!charts || !charts.dataset || !charts.dataset.data) {
            resolve("");
            return;
        }
               // console.log("Trying to parse "+charts.dataset.data);

        var data=JSON.parse(charts.dataset.data);
        //console.log(JSON.stringify(data));
        var curr_item,curr_title, curr_data_data, curr_eng_title,curr_data_thing;
        var curr_year,last_year;
        for(curr_item of data.item) {
           console.log("curr_item="+JSON.stringify(curr_item));
            curr_title=curr_item.title;
            console.log("curr_title="+curr_title);
            if(german_english_map[curr_title]!==undefined && curr_item.data&&curr_item.data.data) {
                curr_eng_title=german_english_map[curr_title];
                if(curr_item.data.data.length>=1) {
                    if(my_query.fields[curr_eng_title+" Years"]==="No data") my_query.fields[curr_eng_title+" Years"]="";
                    curr_year=curr_item.data.data[curr_item.data.data.length-1];
                    my_query.fields[curr_eng_title+" 1"]=curr_year.formattedValue;
                    my_query.fields[curr_eng_title+" Years1"]=curr_year.year;
                }
                if(curr_item.data.data.length>=2) {
                    if(my_query.fields[curr_eng_title+" Years"]==="No data") my_query.fields[curr_eng_title+" Years"]="";

                    curr_year=curr_item.data.data[curr_item.data.data.length-2];
                    my_query.fields[curr_eng_title+" 2"]=curr_year.formattedValue;
                    my_query.fields[curr_eng_title+" Years2"]=curr_year.year;
                }
            }
            else if(curr_title==="Mitarbeiter" && curr_item.data&&curr_item.data.data) {
                curr_year=curr_item.data.data[curr_item.data.data.length-1];
                my_query.fields["Employee"]=curr_year.formattedValue;
            }


        }
        resolve("");
    }
    function fail_function(response) {
            console.log("JSON Failed" + response);
            GM_setValue("returnHit"+MTurk.assignment_id,true);
        }


    function init_Query()
    {
        console.log("in init_query");
        var i;
       
        my_query={name:document.querySelector("form a").innerText.trim(),
                  fields:{"on Northdata":"Yes","Company ID":"","Profit 1":"No data","Profit 2":"No data","Profit Years":"No data","Revenue 1":"No data",
                         "Revenue 2":"No data","Revenue Years":"No data","Assets 1":"No data","Assets 2":"No data","Assets Years":"No data","Employee":"No data"},
                  done:{},submitted:false,try_count:{"json":0}};
        my_query.name=my_query.name.replace(/\(.*$/,"");
        var search_str=my_query.name.replace(/\&.*$/,"");

        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(my_query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });
        
    }

})();