// ==UserScript==
// @name         MDesJardins
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Stuff about JJNissen
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
// @grant        GM_setClipboard
// @grant GM_xmlhttpRequest
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// ==/UserScript==

(function() {
    'use strict';
    function check_and_submit()
    {


        setTimeout(function() { document.getElementById("submitButton").click(); }, 1000);

    }
    function google1_response(response,my_query) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        var search=doc.getElementById("search");

        var g_stuff=search.getElementsByClassName("g");
        var i;
        var g1_success=false;
        var t_url="", t_header_search="";
        for(i=0; i < g_stuff.length; i++)
        {
            try
            {
                t_url=g_stuff[i].getElementsByTagName("cite")[0].innerText; // url of query
                t_header_search=g_stuff[i].getElementsByClassName("r")[0].innerText; // basic description
                if(t_url.indexOf("https://www.linkedin.com/company/")===0)
                {
                    g1_success=true;
                    break;
                }
            }
            catch(error)
            {
                console.log("ERROR");
                break;
            }

            //console.log(temp1);
        }
        if(g1_success)
        {
            /* Continue */
            var company_name="";
            var t_split = t_header_search.split(/( - )|(\|)|(,)/g);

            if(t_split!== null && t_split.length>0) company_name=t_split[0].trim();
            document.getElementsByName("Company Name")[0].value=company_name;
            my_query.company_name=company_name;
            /* Query for individual dude */
            var search_str=my_query.company_name+" "+my_query.fname+" "+my_query.lname+" Linkedin";
            var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);
            GM_xmlhttpRequest({
                method: 'GET',
                url:    search_URI,

                onload: function(response) {

                    google2_response(response, my_query); }

            });
        }
                else
        {
            console.log("g1 Fail");
            var access_URI="http://"+my_query.domain;

            /* Try the page */
            GM_xmlhttpRequest({
                method: 'GET',
                url:    access_URI,
                onerror: function(response) {
                    document.getElementsByClassName("panel-heading")[0].firstChild.innerHTML="<strong>URL Load Error</strong>";
                    GM_setValue("returnHit",true);
                    return;



                },
                onabort: function(response) {
                    document.getElementsByClassName("panel-heading")[0].firstChild.innerHTML="<strong>URL Load Error</strong>";
                                        GM_setValue("returnHit",true);

                    return;



                },
                ontimeout: function(response) {
                    document.getElementsByClassName("panel-heading")[0].firstChild.innerHTML="<strong>URL Load Error</strong>";
                                       GM_setValue("returnHit",true);

                    return;



                },
                onload: function(response) {
                    var doc = new DOMParser()
                    .parseFromString(response.responseText, "text/html");



                    my_query.company_name=doc.title.replace(/^Welcome to/,"");
                    var temp_split=my_query.company_name.split(/ [\|\-] /g);

                    if(temp_split!==null && temp_split.length>=2)
                    {
                        if(temp_split[0].trim().indexOf("Home Page") !== -1 || temp_split[0].trim()==="Home" ||
                          (temp_split[0].trim().length > 2 * temp_split[1].trim().length && temp_split[0].trim().indexOf("Home")!==-1))

                        {
                            my_query.company_name=temp_split[1].trim();
                        }
                        else
                        {
                            my_query.company_name=temp_split[0].trim();
                        }
                    }
                    /*my_query.company_name=my_query.company_name.replace(/( \| )|( - )/g," ");
                    my_query.company_name=my_query.company_name.replace(/( \|)|( -)/g," ");
                    my_query.company_name=my_query.company_name.replace(/(\| )|(- )/g," ");

                    my_query.company_name=my_query.company_name.replace("Home Page","");
                    my_query.company_name=my_query.company_name.replace("Home","");*/
                    if(my_query.company_name.toLowerCase().indexOf(my_query.domain)!==-1 || my_query.company_name==="Coming Soon" || my_query.company_name==="")
                    {
                        document.getElementsByClassName("panel-heading")[0].firstChild.innerHTML="<strong>DEFUNCT site</strong>";
                        GM_setValue("returnHit",true);
                        return;
                    }

                    document.getElementsByName("Company Name")[0].value=my_query.company_name;
                    /* Query for individual dude */
                    var search_str=my_query.company_name+" "+my_query.fname+" "+my_query.lname+" Linkedin";
                    var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url:    search_URI,

                        onload: function(response) {

                            google2_response(response, my_query); },
                        onerror: function(response) { GM_setValue("returnHit",true); },
                        ontimeout: function(response) { GM_setValue("returnHit",true); },
                        onabort: function(response) { GM_setValue("returnHit",true); }


                    });
                }

            });
        }
    }

    /* Get company name */
    function bing1_response(response,my_query) {

        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        //console.log(doc.getElementsByTagName("body")[0]);

        //console.log("response.url="+response.finalUrl);
        var search=doc.getElementById("b_content");

        var b_algo=search.getElementsByClassName("b_algo");
        var i, b1_success=false, b_url="", b_header_search;

        //console.log("b_algo.length="+b_algo.length);
        var b_algoheader=search.getElementsByClassName("b_algoheader");
        for(i=0; i < b_algo.length; i++)
        {
            b_url=b_algo[i].getElementsByTagName("cite")[0].innerText; // url of query
            b_header_search=b_algo[i].firstChild.innerText; // basic description
             var x=b_url.match(/https:\/\/.*\.linkedin\.com\/in\//);
            if(x!==undefined && x!== null && x.length>0 &&
               b_algoheader[i].innerText.toLowerCase().indexOf(my_query.lname.toLowerCase())!==-1 &&
               b_algoheader[i].innerText.toLowerCase().indexOf(my_query.fname.toLowerCase())!==-1)

            {
                //console.log("b_url="+b_url+"\nb_header="+b_header_search);
                b1_success=true;
                break;
            }
            else
            {
                //console.log("b_url="+b_url);
            }

        }
        if(b1_success)
        {
            /* Continue */
            document.getElementById("web_url").value=b_url;
            check_and_submit();
            return;

         
        }
        else
        {
            console.log("Failed to find URL");
          GM_setValue("returnHit",true);
        }
    }

    /**
     Try to get a name from the page itself
    */
 

    function init_JennaMasuda()
    {
        var workTable=document.getElementById("workContent").getElementsByTagName("table")[0];

       var fname,lname,company;

        fname=workTable.rows[1].cells[1].innerText;
        lname=workTable.rows[2].cells[1].innerText;
        company=workTable.rows[3].cells[1].innerText;
 
   

        var search_str=fname+" "+lname+" "+ company + " Linkedin";

        // Put into one object/map thing
        var my_query={};
        my_query.fname=fname;
        my_query.lname=lname;
        my_query.company=company;

        var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);

        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
        console.log(search_URIBing);

       

        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,

            onload: function(response) {

                bing1_response(response, my_query); }

        });

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
    
            init_JennaMasuda();
        }

    }
    else
    {
        setTimeout(function() { btns_secondary[0].click(); }, 40000);
        GM_setValue("returnHit",false);
       GM_addValueChangeListener("returnHit", function() {
                if(GM_getValue("returnHit")!==undefined && GM_getValue("returnHit")===true &&
                  btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Return"
                  )
                {

                  btns_secondary[0].click();
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
         btns_primary[0].click();
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