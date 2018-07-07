// ==UserScript==
// @name         ChrisPortin
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
// @include https://businesssearch.sos.ca.gov/*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant        GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var automate=false;
    var email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%]+(\.[^<>()\[\]\\.,;:：\s@"\?]+)*)|("[^\?]+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

    var phone_re=/[\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6}/im;
    var fax_re=/Fax[:]?[\s]?([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;


    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
    var my_query = {};
    var email_list=[];
    var sch_name="School District Name", sch_domain="Domain of school district";
    var bad_urls=[];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;

    function check_function()
    {
	return true;
    }
    function check_and_submit(check_function, automate)
    {
	console.log("in check");
	if(!check_function())
	{
            GM_setValue("returnHit",true);
            console.log("bad");
            return;
	}
	console.log("Checking and submitting");


	if(automate)
	{
            setTimeout(function() { document.getElementById("submitButton").click(); }, 0);
	}
    }	

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow, b_caption;
        var b1_success=false, b_header_search;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);
            if(b_algo.length===0)
            {
                console.log("b_algo length=0");
                GM_setValue("returnHit",true);
                return;
            }
           
            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;


                if(!is_bad_url(b_url, bad_urls))
                {
                    document.getElementById("webpage_url").value=b_url;
                    check_and_submit(check_function);
                    return;

                }
                
            }
            return;
           /* if(!found_url)
            {
                document.getElementById("UrlBad").checked=true;
                check_and_submit();
                b1_success=true;
                return;
            }*/

          //GM_setValue("returnHit",true);
            //return;

        }
        catch(error)
        {
	    console.log("Error "+error);
	    GM_setValue("returnHit",true);
            return;
            
            //reject(JSON.stringify({error: true, errorText: error}));
        }
        GM_setValue("returnHit",true);
        return;

    }

    function query_search(resolve,reject,type) {
        var search_str=my_query.name+" ";

        console.log("Searching for "+search_str+", type="+type);

         GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URL,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             query_response(response, resolve, reject,type);
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


            });
    }

    /* Following the finding the district stuff */
    function query_promise_then(to_parse) {

        var search_str, search_result=JSON.parse(to_parse);
        console.log("search_result="+to_parse);
       

    }


    function do_details()
    {
        var ret_val={};
        var main=document.getElementById("maincontent");
        var row=main.getElementsByClassName("row");
        ret_val["registration date"]="N/A";
        ret_val["status"]="N/A";
        ret_val["agent"]="N/A";
        ret_val["agent2"]="N/A";
        ret_val["agent3"]="N/A";
        ret_val["address1"]="N/A";
        ret_val["address2"]="N/A";
        ret_val["address3"]="N/A";
        ret_val["address4"]="N/A";
        if(row.length>=3) ret_val["registration date"]=row[2].getElementsByClassName("col-sm-8")[0].innerText.trim();

        if(row.length>=6) ret_val["status"]=row[5].getElementsByClassName("col-sm-8")[0].innerText.trim();
        if(row.length>=7)
        {
            console.log(row[6].getElementsByClassName("col-sm-8")[0].innerText.split("\n"));
            var agent_stuff=row[6].getElementsByClassName("col-sm-8")[0].innerText.split("\n");
            if(agent_stuff.length>=1) ret_val["agent"]=agent_stuff[0].trim();
            if(agent_stuff.length>=2) ret_val["agent2"]=agent_stuff[1].trim();
            if(agent_stuff.length>=3) ret_val["agent3"]=agent_stuff[2].trim();
        }
        if(row.length>=8)
        {
            console.log(row[7].getElementsByClassName("col-sm-8")[0].innerText.split("\n"));
            var entity_stuff=row[7].getElementsByClassName("col-sm-8")[0].innerText.split("\n");
            if(entity_stuff.length>=1) ret_val["address1"]=entity_stuff[0].trim();
            if(entity_stuff.length>=2) ret_val["address2"]=entity_stuff[1].trim();

        }
        if(row.length>=9)
        {
            var mailing_stuff=row[8].getElementsByClassName("col-sm-8")[0].innerText.split("\n");
            if(mailing_stuff.length>=1) ret_val["address3"]=mailing_stuff[0].trim();
            if(mailing_stuff.length>=2) ret_val["address4"]=mailing_stuff[1].trim();

        }
        console.log("result="+JSON.stringify(ret_val));
        GM_setValue("result",JSON.stringify(ret_val));

    }


    function init_Query()
    {

       var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        my_query={name: wT.rows[0].cells[1].innerText};
        GM_setValue("result","");
        GM_addValueChangeListener("result", function() {
            var result=JSON.parse(GM_getValue("result"));
            console.log("result="+JSON.stringify(result));
            var x;
           /* document.getElementById("registration date").value=result["registration date"];
            document.getElementById("status").value=result["status"];
            document.getElementById("agent").value=result["agent"];
            document.getElementById("agent2").value=result["agent2"];
            document.getElementById("agent3").value=result["agent3"];
            document.getElementById("address1").value=result["address1"];
            document.getElementById("address2").value=result["address2"];
            document.getElementById("address3").value=result["address3"];
            document.getElementById("address4").value=result["address4"];*/
            for(x in result)
            {
                if(document.getElementById(x)!==null)
                {
                    document.getElementById(x).value=result[x].replace(/^$/,"N/A");
                }
            }
            document.getElementById("address3").value=result["address3"];
            document.getElementById("address4").value=result["address4"];
            check_and_submit(function() {}, automate);
        });

console.log("Setting search_query");
        GM_setValue("search_query",JSON.stringify({name: my_query.name, type: "CORP"}));




    }

    /* Failsafe to stop it  */
    window.addEventListener("keydown",function(e) {
        if(e.key !== "F1") {
            return;
        }
        GM_setValue("stop",true);
     });


    if (window.location.href.indexOf("mturkcontent.com") != -1 || window.location.href.indexOf("amazonaws.com") != -1)
    {
        var submitButton=document.getElementById("submitButton");
        if(!submitButton.disabled )
        {

            init_Query();
        }

    }
    else if(window.location.href.indexOf("businesssearch.sos.ca.gov")!==-1)
    {
        var ret_val={};
        GM_setValue("search_query","");
        GM_addValueChangeListener("search_query",function() {
            console.log("New value found");
            var search_query=JSON.parse(GM_getValue("search_query"));
            var search_URL="https://businesssearch.sos.ca.gov/CBS/SearchResults?SearchType="+search_query.type;
            search_URL=search_URL+"&SearchCriteria="+encodeURIComponent(search_query.name)+"&SearchSubType=Keyword";
            if(search_query.name.length>=0)
                window.location.href=search_URL;
        });
        if(window.location.href.indexOf("Detail")!==-1)
        {
            console.log("Found details");
            do_details();
            return;
        }
        else
        {
            console.log("Detail not found");
            var entityId=document.getElementsByName("EntityId");
            if(entityId.length>0)
            {
                entityId[0].click();
            }
            else if(window.location.href.indexOf("SearchType=CORP")!==-1)
            {
                var search_query=JSON.parse(GM_getValue("search_query"));
                GM_setValue("search_query",JSON.stringify({name: search_query.name, type: "LPLLC"}));
                /* Should go  */
            }
            else
            {
                /* We done */
                ret_val["registration date"]="N/A";
                ret_val["status"]="N/A";
                ret_val["agent"]="N/A";
                ret_val["agent2"]="N/A";
                ret_val["agent3"]="N/A";
                ret_val["address1"]="N/A";
                ret_val["address2"]="N/A";
                ret_val["address3"]="N/A";
                ret_val["address4"]="N/A";
                GM_setValue("result",JSON.stringify(ret_val));
            }

        }
    }
    else
    {
	/* Should be MTurk itself */
       
        if(automate)
        {
            setTimeout(function() { btns_secondary[0].click(); }, 20000); }
        GM_setValue("returnHit",false);
       GM_addValueChangeListener("returnHit", function() {
                if(GM_getValue("returnHit")!==undefined && GM_getValue("returnHit")===true &&
                  btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Return"
                  )
                {
                    if(automate) {
                        setTimeout(function() { btns_secondary[0].click(); }, 0); }
                }
            });
         /* Regular window at mturk */
        var btns_primary=document.getElementsByClassName("btn-primary");
        var btns_secondary=document.getElementsByClassName("btn-secondary");
        if(GM_getValue("stop") !== undefined && GM_getValue("stop") === true)
        {
        }
        else if(btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Skip" &&
               btns_primary!==undefined && btns_primary.length>0 && btns_primary[0].innerText==="Accept")
        {

            /* Accept the HIT */
            if(automate) {
                btns_primary[0].click(); }
        }
        else
        {
            /* Wait to return the hit */
            console.log("MOO");
            var cboxdiv=document.getElementsByClassName("checkbox");
            var cbox=cboxdiv[0].firstChild.firstChild;
            if(cbox.checked===false) cbox.click();
        }

    }


})();