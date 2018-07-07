// ==UserScript==
// @name         SebastianEllefson
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Do SebastianEllefson
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://*facebook.com/*
// @include https://*twitter.com/*
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
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var automate=false;
    var email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%]+(\.[^<>()\[\]\\.,;:：\s@"\?]+)*)|("[^\?]+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;
    var full_state_map={    "AL": "Alabama",   "AK": "Alaska",    "AS": "American Samoa",    "AZ": "Arizona",
    "AR": "Arkansas",    "CA": "California",    "CO": "Colorado",    "CT": "Connecticut",    "DE": "Delaware",  "DC": "District Of Columbia",
    "FL": "Florida",    "GA": "Georgia",    "GU": "Guam",    "HI": "Hawaii",    "ID": "Idaho",    "IL": "Illinois",    "IN": "Indiana",
    "IA": "Iowa", "KS": "Kansas",    "KY": "Kentucky",    "LA": "Louisiana",    "ME": "Maine",    "MD": "Maryland",    "MA": "Massachusetts",
    "MI": "Michigan",    "MN": "Minnesota",    "MS": "Mississippi",    "MO": "Missouri",    "MT": "Montana",    "NE": "Nebraska",
    "NV": "Nevada",    "NH": "New Hampshire",    "NJ": "New Jersey",    "NM": "New Mexico",    "NY": "New York",    "NC": "North Carolina",
    "ND": "North Dakota","OH": "Ohio","OK":"Oklahoma", "OR": "Oregon","PA": "Pennsylvania","PR": "Puerto Rico","RI": "Rhode Island",
    "SC": "South Carolina",    "SD": "South Dakota",    "TN": "Tennessee",    "TX": "Texas",    "UT": "Utah","VT": "Vermont",
    "VI": "Virgin Islands","VA": "Virginia",    "WA": "Washington",    "WV": "West Virginia",    "WI": "Wisconsin",    "WY": "Wyoming"};
    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
    var my_query = {};
    var email_list=[];
    var bad_urls=["app.lead411.com/","discoverthem.com/","searchherenow.com/"];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;
    var my_FB={};  // status: 0 is ready
    var my_Twitter={};

    function check_and_submit()
    {

        console.log("Checking and submitting");

        if(automate)
            setTimeout(function() { document.getElementById("submitButton").click(); }, 1000);

    }
    function bing_response(response,resolve,reject) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        console.log("in domain_response");
        var search;

        var b_algo;
        //   var g_stuff;
        var i;

        var b_url="";
        var good_twitter_RegEx=/^https:\/\/twitter\.com\/[^\/]+$/;


        var b1_success=false, b_header_search;
        var new_select=document.createElement("select");
        new_select.id="web01_url";
        new_select.name="web01_url";
        var temp_option;
        temp_option=document.createElement("option");
        temp_option.text="";
//        temp_option.value="";
        new_select.add(temp_option);
        try
        {
            search=doc.getElementById("b_content");

            b_algo=search.getElementsByClassName("b_algo");

            i=0;
            for(i=0; i < b_algo.length; i++)
            {
                b_url=b_algo[i].getElementsByTagName("a")[0].href; // url of query
                temp_option=document.createElement("option");
                temp_option.text=b_url;
                new_select.add(temp_option);

                if(good_twitter_RegEx.test(b_url)) {
                    b1_success=true;
                    break;
                }


            }

            if(b1_success)
            {
                GM_setValue("Twitterurl",b_url);
                resolve(b_url);
            }
            else
            {
                reject("Failed with url");
            }
        }
        catch(error)
        {
            console.log("Error");
            reject("Failed with url");
        }
        document.getElementById("web01_url").replaceWith(new_select);
    }
    function bing_search(resolve,reject) {
        var bing_search_str;
        bing_search_str=my_query.name+" "+my_query.race+" "+my_query.state+" campaign";//" "+my_query.city+" "+my_query.state+" Twitter";
        console.log("Searching with bing for "+bing_search_str);
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(bing_search_str)+"&first=1&rdr=1";
       // var domain_URL='https://www.google.com/search?q='+encodeURIComponent(google_search_str);//+" company");
        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             bing_response(response, resolve, reject);
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


            });
    }





    function init_Sebastian()
    {
        var seb_re=/Please find the campaign website for\s(.*)\srunning for\s(.*)\sin\s(.*)\./;
        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        var inst_body=document.getElementById("instructionBody");
        var p=inst_body.getElementsByTagName("p")[0];
        var i;
        for(i=0; i < 9; i++)
            p.parentNode.removeChild(p.nextSibling);
        var p_text=p.innerText;
        var my_match=p_text.match(seb_re);
        console.log("p_text="+p_text);
        if(my_match!==null && my_match.length>=4)
        {
            my_query.name=my_match[1];
            my_query.race=my_match[2];
            my_query.state=my_match[3];
        }
        my_query.name=my_match[1];
        console.log(JSON.stringify(my_query));
 
        const WebPromise = new Promise((resolve, reject) => {
            console.log("Beginning Web search");
            bing_search(resolve, reject);
        });
        WebPromise.then(function(val) { console.log("Val="+val); }
        )
        .catch(function(val) {

            console.log("Could not find FB URL");
            my_query.doneFB=true;
                if(my_query.doneWeb && my_query.doneFB)
                {
                    check_and_submit();
                }
        });





    }
    /* Initialize Twitter */




    if (window.location.href.indexOf("mturkcontent.com") !== -1 || window.location.href.indexOf("amazonaws.com") !== -1)
    {
        var submitButton=document.getElementById("submitButton");
        if(!submitButton.disabled )
        {

            init_Sebastian();
        }

    }
    else
    {
       // console.log("In LuisQuintero main");
        if(automate)
            setTimeout(function() { btns_secondary[0].click(); }, 40000);
        GM_setValue("returnHit",false);
       GM_addValueChangeListener("returnHit", function() {
                if(GM_getValue("returnHit")!==undefined && GM_getValue("returnHit")===true &&
                  btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Return"
                  )
                {
                    if(automate)
                        setTimeout(function() { btns_secondary[0].click(); }, 1000);
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
            if(automate)
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