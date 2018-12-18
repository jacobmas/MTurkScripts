// ==UserScript==
// @name         SEDARGeoffroy
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
// @include https://www.sedar.com/*
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

    var automate=true;
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
            setTimeout(function() { document.getElementById("submitButton").click(); }, 1000);
	}
    }
    function is_bad_name(b_name)
    {
	return false;
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
		b_caption=b_algo[i].getElementsByClassName("b_caption")[0].innerText;



                if(!is_bad_url(b_url, bad_urls) && !is_bad_name(b_name))
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

    function do_sedar()
    {
        var curr_loc=window.location.href;
        if(curr_loc.indexOf("search_form_pc_en.htm")!==-1)
        {
            GM_setValue("my_query","");
            GM_addValueChangeListener("my_query", function() {
                var my_query=GM_getValue("my_query");
                document.getElementsByName("company_search")[0].value=my_query.name;
                var doc_select=document.getElementsByName("document_selection")[0];
                var dates=["FromMonth","FromDate","FromYear","ToMonth","ToDate","ToYear"];
                var date_selects={};
                var i;
                for(i=0; i < dates.length; i++)
                {
                    date_selects[dates[i]]=document.getElementsByName(dates[i])[0];
                }
                date_selects["FromDate"].value="01";
                date_selects["ToDate"].value=date_selects["ToDate"].options[date_selects["ToDate"].length-1].value;
                date_selects.FromMonth.value=my_query.month;
                date_selects.ToMonth.value=my_query.month;
                date_selects.FromYear.value=my_query.year;
                date_selects.ToYear.value=my_query.year;
                for(i=0; i < doc_select.options.length; i++)
                {
                    if(doc_select.options[i].innerText.toLowerCase()===my_query.form_name.toLowerCase())
                    {
                        doc_select.value=doc_select.options[i].value;
                        break;
                    }
                }
                console.log("Clicking");
                document.getElementsByName("Search")[0].click();
document.getElementsByName("Search")[0].submit();


            });
        }
        else if(curr_loc.indexOf("/FindCompanyDocuments.do")!==-1)
        {
            var content=document.getElementById("content");
            var tables=content.getElementsByTagName("table");
            var the_table=tables[1];
            var the_cell=the_table.rows[1].cells[3];
            if(the_cell===undefined)
            {
                console.log("Cell is undefined");
                GM_setValue("returnHit",true);
                window.location.href="https://www.sedar.com/search/search_form_pc_en.htm";
                return;
            }

            var the_a=the_cell.getElementsByTagName("a")[0];
            var title=the_a.getAttribute("title");
            var ret_url="https://www.sedar.com/GetFile.do?lang=EN"+title;
            GM_setValue("result",ret_url);
          window.location.href="https://www.sedar.com/search/search_form_pc_en.htm";
        }
    }






    function init_Query()
    {

       var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        var file_date=wT.rows[2].cells[1].innerText.split("/");
        var month=file_date[0];
        if(month.length<2) month="0"+month;

        my_query={name: wT.rows[0].cells[1].innerText, form_name: wT.rows[1].cells[1].innerText,
                 month: month, year: file_date[1].replace(/\s/g,"")};
        my_query.name=my_query.name.replace(/ Inc\..*/i,"").replace(/ Corp\..*/i,"").replace(/ Ltd\..*/i,"");
        console.log("my_query="+JSON.stringify(my_query));
        GM_setValue("result","");
        GM_addValueChangeListener("result", function() {
            document.getElementById("web_url").value=GM_getValue("result");
            check_and_submit(check_function,automate);
        });
        GM_setValue("my_query",my_query);


        





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
    else if(window.location.href.indexOf("sedar.com")!==-1)
    {
        do_sedar();
    }
    else if(window.location.href.indexOf("mturk.com")!==-1)
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
                        setTimeout(function() { btns_secondary[0].click(); }, 1500); }
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
