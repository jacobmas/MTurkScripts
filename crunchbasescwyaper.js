// ==UserScript==
// @name         CrunchBaseScwyaper
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://www.crunchbase.com/*
// @include https://worker.mturk.com/*
// @include file://*
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
                    b1_success=true;
		    break;

                }
                
            }
	    if(b1_success)
	    {
		/* Do shit */
	    }
           

        }
        catch(error)
        {
	    console.log("Error "+error);
	    reject(error);
            return;
            
            //reject(JSON.stringify({error: true, errorText: error}));
        }
	reject("Nothing found");
//        GM_setValue("returnHit",true);
        return;

    }

    function query_search(search_str, resolve,reject) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
        var domain_URL='https://www.google.com/search?q='+encodeURIComponent(search_str);//+" company");
        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             query_response(response, resolve, reject);
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


            });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {


    }





    function init_Query()
    {

        GM_setValue("starting",true);
         GM_setValue("plopping",false);
       var url=document.getElementsByClassName("dont-break-out")[0].href.replace(/#.*$/,"");
        GM_setValue("result","");
        GM_addValueChangeListener("result",function() {
            var result=GM_getValue("result");
            var x;
            for(x in result)
            {
                document.getElementsByName(x)[0].value=result[x];

            }
            check_and_submit(check_function,automate);

        });
        GM_setValue("url",url);


        





    }

    function fix_money(to_parse)
    {
        var money_re=/(\d+).(\d)M/;
        var money_re2=/(\$\d+)M/;
        to_parse=to_parse.replace(money_re,"$1,$200,000");
        to_parse=to_parse.replace(money_re2,"$1,000,000");
        return to_parse;
    }


    function do_crunchbase()
    {
        var i;
        var result={Company_Name_CBase:"",Website_URL_CBase:"",Funding_Status_CBase:"",
                   Last_Funding_Type_CBase:"", Number_of_Funding_Rounds_CBase: "", Total_Funding_Amount_CBase:"",
                   Number_Lead_Investors_CBase: "", Number_Investors_CBase: "",
                   Recent_Lead_Investor_1_CBase: "", Recent_Lead_Investor_2_CBase: "", Recent_Lead_Investor_3_CBase: "",
                   Recent_Lead_Investor_4_CBase: "", Recent_Lead_Investor_5_CBase: ""};

        var x;
        for(x in result) result[x]="NA";
        result.Website_URL_CBase="http://www.NA.com";

        var field_label=document.getElementsByClassName("field-label");

        var bigValue=document.getElementsByClassName("bigValueItemLabelOrData");


        var field_value=document.getElementsByClassName("field-value");



        var curr_inv_number=1;

        result.Company_Name_CBase=document.getElementsByClassName("identifier-label")[0].innerText.trim();

        for(i=0; i < field_label.length; i++)
        {
            if(field_label[i].innerText.indexOf("Website")!==-1) {
                result.Website_URL_CBase=field_value[i].getElementsByTagName("a")[0].href;
            }
            else if(field_label[i].innerText.indexOf("Funding Status")!==-1) {
                result.Funding_Status_CBase=field_value[i].innerText;
            }
            else if(field_label[i].innerText.indexOf("Last Funding Type")!==-1) {
                result.Last_Funding_Type_CBase=field_value[i].innerText;
            }


        }
        for(i=0; i < bigValue.length-1; i+=2)
        {
            if(bigValue[i].innerText.indexOf("Number of Funding Rounds")!==-1)
            {
                result.Number_of_Funding_Rounds_CBase=bigValue[i+1].innerText;
            }
            else if(bigValue[i].innerText.indexOf("Total Funding Amount")!==-1)
            {
                result.Total_Funding_Amount_CBase=fix_money(bigValue[i+1].innerText);
            }
            else if(bigValue[i].innerText.indexOf("Number of Lead Investors")!==-1)
            {
                result.Number_Lead_Investors_CBase=bigValue[i+1].innerText;
            }
            else if(bigValue[i].innerText.indexOf("Number of Investors")!==-1)
            {
                result.Number_Investors_CBase=bigValue[i+1].innerText;
            }
        }




        //result.Website_URL_CBase=field_value[9].getElementsByTagName("a")[0].href;


        console.log("result="+JSON.stringify(result));
        GM_setValue("temp_result",result);
        //alert("url="+GM_getValue("url"));
        if(result.Number_Lead_Investors_CBase!=="NA")
        {
            setTimeout(function() {
        window.location.href=window.location.href+"/investors/investors_list";
        }, 100);
        }
        else
        {
            GM_setValue("result",result);
        }

    }

    function do_investors(result)
    {
        var curr_inv_number=1;
        var investors_found={};
        var body_wrapper=document.getElementsByClassName("body-wrapper");

        var grid_rows=body_wrapper[0].getElementsByClassName("component--grid-row");
        var grid_cells;
        var i;
        for(i=0; i< grid_rows.length; i++)
        {
            grid_cells=grid_rows[i].getElementsByClassName("component--grid-cell");
            if(grid_cells[1].innerText==="Yes" && curr_inv_number<=5 && !(grid_cells[0].innerText in investors_found) )
            {
                result["Recent_Lead_Investor_"+curr_inv_number+"_CBase"]=grid_cells[0].innerText;
                investors_found[grid_cells[0].innerText]=true;
                curr_inv_number++;
            }

        }
        GM_setValue("result",result);
        window.location.href="http://www.crunchbase.com";
    }

    /* Failsafe to stop it  */
    window.addEventListener("keydown",function(e) {
        if(e.key !== "F1") {
            return;
        }
        GM_setValue("stop",true);
     });


    if (window.location.href.indexOf("mturkcontent.com") !== -1 || window.location.href.indexOf("amazonaws.com") !== -1)
    {
        var submitButton=document.getElementById("submitButton");
        if(!submitButton.disabled )
        {

            init_Query();
        }

    }
    else if(window.location.href.indexOf("crunchbase.com") !==-1)
    {
        if(window.location.href.indexOf("/investors/investors_list")===-1 )
        {



            GM_setValue("url","");
            GM_addValueChangeListener("url", function() { window.location.href=GM_getValue("url"); });
            if(window.location.href!=="https://www.crunchbase.com/")
            {
                console.log("window.location.href="+window.location.href);
                do_crunchbase();
            }
        }
        else if(window.location.href!=="https://www.crunchbase.com/")
        {
            console.log("window.location.href="+window.location.href);
            do_investors(GM_getValue("temp_result"));
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
