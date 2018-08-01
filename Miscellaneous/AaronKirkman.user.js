// ==UserScript==
// @name         AaronKirkman
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
            setTimeout(function() { document.getElementById("submitButton").click(); }, 0);
        }
    }	

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var fmq_party_name;
        var id_class;
        var facility_id_re=/Facility ID:\s*([\d]+)/;
        var NAD27_re=/NAD27( Coordinates)?:\s*([^\"]*\")\s*([^\"]*\")/;
        var NAD83_re=/NAD83( Coordinates)?:\s*([^\"]*\")\s*([^\"]*\")/;
        var power_re=/Power:\s*([^A-Za-z]*\skW)/;
        var haat_re=/Maximum HAAT: ([\d]+\s*m)/;
        var height_re=/Overall antenna height above ground: ([\d]+\s*m)/;
        var NAD27_match,NAD83_match,power_match,haat_match,height_match;
        var fmq_am_table;
        var facility_match;
        var call_sign;
        var fmq_fm_data, fmq_app_type;
        var fmq_fm_table;

       /* try
        {*/
        fmq_fm_data=doc.getElementsByClassName("fmq-fm-data");
        fmq_am_table=doc.getElementsByClassName("fmq-am-table");
        fmq_app_type=doc.getElementsByClassName("fmq-app-type");
        fmq_fm_table=doc.getElementsByClassName("fmq-fm-table");
        call_sign=doc.getElementsByClassName("fmq-party-call");

        fmq_party_name=doc.getElementsByClassName("fmq-party-name");
        id_class=fmq_party_name[4];
        facility_match=id_class.innerText.match(facility_id_re);
        if(facility_match!==null)
        {
            document.getElementById("element_1").value=facility_match[1];
        }
        if(call_sign.length>0)
        {
            document.getElementById("element_2").value=call_sign[0].innerText;
        }
        document.getElementById("element_3").value=fmq_party_name[2].innerText;


        for(i=0; i < fmq_fm_table.length; i++)
        {

            if(fmq_fm_table[i].innerText.indexOf("Effective Radiated Power")!==-1)
            {
                document.getElementById("element_8").value=fmq_fm_table[i].nextElementSibling.innerText;
                document.getElementById("element_9").value=fmq_fm_table[i].nextElementSibling.nextElementSibling.innerText;
            }
            else if(fmq_fm_table[i].innerText.indexOf("Radiation center above average terrain")!==-1)
            {
                document.getElementById("element_10").value=fmq_fm_table[i].nextElementSibling.innerText;
                document.getElementById("element_11").value=fmq_fm_table[i].nextElementSibling.nextElementSibling.innerText;
            }
        }
        if(fmq_fm_data.length>0)
        {
            NAD27_match=fmq_fm_data[0].innerText.match(NAD27_re);
            NAD83_match=fmq_fm_data[0].innerText.match(NAD83_re);
            power_match=fmq_fm_data[0].innerText.match(power_re);
            haat_match=fmq_fm_data[0].innerText.match(haat_re);
            height_match=fmq_fm_data[0].innerText.match(height_re);
            if(NAD27_match!==null)
            {
                document.getElementById("element_4").value=NAD27_match[2];
                document.getElementById("element_5").value=NAD27_match[3];
            }
            if(NAD83_match!==null)
            {
                document.getElementById("element_6").value=NAD83_match[2];
                document.getElementById("element_7").value=NAD83_match[3];
            }
            if(haat_match!==null)
            {
                document.getElementById("element_12").value=haat_match[1];
            }
            if(height_match!==null)
            {
                document.getElementById("element_13").value=height_match[1];
            }
        }
        document.getElementById("element_14").value="";
        for(i=0; i < fmq_app_type.length; i++)
        {
            if(fmq_app_type[i].innerText.indexOf("New Station")!==-1)
            {
                var good_sibling=fmq_app_type[i].nextElementSibling.nextElementSibling;
                document.getElementById("element_14").value=good_sibling.innerText;
                break;
            }
        }
        check_and_submit(function() { return true; }, automate);

        /*}*/
       /* catch(error)
        {
            console.log("Error "+error);
            GM_setValue("returnHit",true);
            return;

            //reject(JSON.stringify({error: true, errorText: error}));
        }*/
        
    }

    function query_search(resolve,reject) {
        
        GM_xmlhttpRequest({
            method: 'GET',
            url:    my_query.url,

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
    function query_promise_then(to_parse) {

        var search_str, search_result=JSON.parse(to_parse);
        console.log("search_result="+to_parse);
       

    }





    function init_Query()
    {

       var dontbreakout=document.getElementsByClassName("dont-break-out")[0].href;
        my_query={url: dontbreakout};


        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(resolve, reject);
        });
        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });





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