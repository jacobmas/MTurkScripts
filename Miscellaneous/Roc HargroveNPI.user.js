// ==UserScript==
// @name         Roc HargroveNPI
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
    var MTurk=new MTurkScript(30000,1250+(Math.random()*500),[],begin_script,"A1SK2GV23YJWN9",false);
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
			b_algo=doc.querySelectorAll("#b_results > .b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context)); }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<1; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(type==="healthprovidersdata" && new RegExp(my_query.first_name,"i").test(b_name) && new RegExp(my_query.last_name,"i").test(b_name)) {
                    resolve({"url":b_url,"NPI":b_name.replace(/.* NPI /,"").trim()});
                    return;
                }
                if(type==="topnpi" && new RegExp(my_query.first_name,"i").test(b_name) && new RegExp(my_query.last_name,"i").test(b_name)) {
                    resolve({"url":b_url,"NPI":b_url.replace(/.*topnpi\.com\/[a-z]+([\d]+)\/.*$/,"$1").trim()});
                    return;
                }
                if(type==="npiprofile" && new RegExp(my_query.first_name,"i").test(b_name) && new RegExp(my_query.last_name,"i").test(b_name)) {
                    resolve({"url":b_url,"NPI":b_url.replace(/[^\d]*/g,"").trim()});
                    return;
                }


		   //&& (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
	do_next_query(resolve,reject,type);
        return;
    }
    function do_next_query(resolve,reject,type) {
        if(my_query.try_count[type]===0) {
            var search_str=my_query.first_name+" "+my_query.last_name+" "+(reverse_state_map[my_query.state]||"");//+" "+my_query.specialization;

            my_query.try_count[type]+=1;
                        query_search(search_str+" site:"+type+".com", resolve, reject, query_response,type);
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
    function healthprovidersdata_promise_then(result) {
        console.log("result=",result);
        my_query.done.healthprovidersdata=true;
        if(result.NPI&&my_query.priority>3) {
            my_query.fields["NPI "]=result.NPI;
            my_query.priority=3+3*my_query.try_count.healthprovidersdata;

        }
        submit_if_done();
            return;
    }

    function topnpi_promise_then(result) {
          console.log("result=",result);
        my_query.done.topnpi=true;
        if(result.NPI&&my_query.priority>2) {
            my_query.fields["NPI "]=result.NPI;
            my_query.priority=2+3*my_query.try_count.topnpi;
        }
        submit_if_done();
            return;
    }
     function npiprofile_promise_then(result) {
          console.log("result=",result);

         var promise=MTP.create_promise(result.url,parse_npiprofile,parse_npiprofile_then,function() { my_query.done.npiprofile=true; submit_if_done(); });

            return;
    }

    function parse_npiprofile(doc,url,resolve,reject) {
     //   console.log("doc=",doc.body.innerHTML);
        var table=doc.querySelector("#table-npi-provider-information");
        var row;
        if(!table) {
            reject("");
            return;
        }
        let npi=table.rows[0].cells[1].innerText.trim();
        for(row of table.rows) {
            if(/NPI Entity Type/.test(row.cells[0].innerText) && /Individual/i.test(row.cells[1].innerText)) {
                resolve({NPI:npi});
                return;
            }
        }
        reject("");


    }
    function parse_npiprofile_then(result) {
         my_query.done.npiprofile=true;
        if(result.NPI&&my_query.priority>2) {
            my_query.fields["NPI "]=result.NPI;
            my_query.priority=1+3*my_query.try_count.npiprofile;
        }
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
            if((field=document.getElementsByName(x)[0])) field.value=my_query.fields[x];
        }
    }

    function submit_if_done() {
        var is_done=true,x,is_done_dones=x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        for(x in my_query.fields) if(!my_query.fields[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones) {
            console.log("Failed to find all fields");
            GM_setValue("returnHit",true);
        }
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        //var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        var data=document.querySelector("form span").innerText.split(/,/);
        var zip=data.length>7?data[7].split(/\|/):"";

        my_query={url:document.querySelector("form a").href,
                  first_name:data[2],last_name:data[3],classification:"",specialization:data[data.length-1]||"",city:data[5]||"",state:data[6]||"",zip:zip[0],
                  fields:
                  {"NPI ":""},done:{healthprovidersdata:false,topnpi:false,npiprofile:false},
                  try_count:{healthprovidersdata:0,topnpi:0,npiprofile:0},
                  submitted:false,priority:1000};
       if(/^[0-9]/.test(data[4])&&data.length>8) {
           my_query.fields.address=data[4]||"";
           my_query.fields.city=data[5]||"";
           my_query.fields.state=data[6]||"";
           my_query.fields.zip=data[7];
           my_query.fields.specialization=data[8];
       }

        console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.first_name+" "+my_query.last_name+" "+(reverse_state_map[my_query.state]||"")+" "+my_query.specialization;
       const healthprovidersdataPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search for ",search_str);
            query_search(search_str+" site:healthprovidersdata.com", resolve, reject, query_response,"healthprovidersdata");
        });
        healthprovidersdataPromise.then(healthprovidersdata_promise_then)
            .catch(function(val) {
            console.log("Failed at this healthprovidersdataPromise " + val); my_query.done.healthprovidersdata=true; submit_if_done(); });
         const topnpiPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search for ",search_str);
            query_search(search_str+" site:topnpi.com", resolve, reject, query_response,"topnpi");
        });
        topnpiPromise.then(topnpi_promise_then)
            .catch(function(val) {
            console.log("Failed at this topnpiPromise " + val); my_query.done.topnpi=true; submit_if_done(); });
        const npiprofilePromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search for ",search_str);
            query_search(search_str+" site:npiprofile.com", resolve, reject, query_response,"npiprofile");
        });
        npiprofilePromise.then(npiprofile_promise_then)
            .catch(function(val) {
            console.log("Failed at this topnpiPromise " + val); my_query.done.npiprofile=true; submit_if_done(); });
    }

})();