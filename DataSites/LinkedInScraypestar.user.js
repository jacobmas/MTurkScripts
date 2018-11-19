// ==UserScript==
// @name         LinkedInScraypestar
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Scraypestar the site for stuff
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://*linkedin.com/*
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

    var automate=true;
    var email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%]+(\.[^<>()\[\]\\.,;:：\s@"\?]+)*)|("[^\?]+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

    var phone_re=/[\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6}/im;
    var fax_re=/Fax[:]?[\s]?([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;


    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
    var my_query = {};
    var email_list=[];
    var sch_name="School District Name", sch_domain="Domain of school district";
    var bad_urls=["www.mapquest.com","local.yahoo.com","yelp.com","birdeye.com","findglocal.com",
                 "facebook.com","menupix.com","www.tripadvisor.com","www.zomato.com","foursquare.com","manta.com",
                 "yellowpages.com","whitepages.com","moviefone.com","s3.amazonaws.com","walkscore.com","superpages.com",
                     "bizapedia.com","restaurants.com","city-data.com","crunchbase.com"];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;

    function bad_email_url(to_check)
    {
        let i;
        for(i=0; i < bad_urls.length; i++)
        {
            if(to_check.indexOf(bad_urls[i])!==-1) return true;
        }
        return false;
    }

    function check_and_submit()
    {

       console.log("Checking and submitting");
        if(automate)
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 0);
        }
    }
    function is_bad_url(the_url)
    {
        var i;
        for(i=0; i < bad_urls.length; i++)
        {
            if(the_url.indexOf(bad_urls[i])!==-1) return true;
        }
        return false;
    }
    function add_to_sheet(yelpid, rating)
    {
        document.getElementById("yelpid").value=yelpid;
        document.getElementsByName("yelprating")[0].value=rating;

    }
    function my_parse_address(to_parse)
    {
        var ret_add={};
        var state_re=/([A-Za-z]+) ([\d\-]+)$/;
        var canada_zip=/ ([A-Z]{2}) ([A-Z][\d][A-Z] [\d][A-Z][\d])$/;
        to_parse=to_parse.replace(canada_zip,", $&");

        console.log("to_parse="+to_parse);
        var my_match;
        var splits=to_parse.split(",");
        if(splits.length===3)
        {
            if(canada_zip.test(splits[2]))
            {
                my_match=splits[2].match(canada_zip);
                ret_add.state=my_match[1];
                ret_add.zip=my_match[2];
            }
            else
            {
                my_match=splits[2].match(state_re);
                if(my_match!==null && my_match!==undefined)
                {
                    ret_add.state=my_match[1];
                    ret_add.zip=my_match[2];
                }
            }
            ret_add.street=splits[0].trim();
            ret_add.city=splits[1].trim();
        }
        else if(splits.length==2)
        {

            if(canada_zip.test(splits[1]))
            {
                my_match=splits[1].match(canada_zip);
                ret_add.state=my_match[1];
                ret_add.zip=my_match[2];
            }
            else
            {
                my_match=splits[1].match(state_re);
                if(my_match!==null && my_match!==undefined)
                {
                    ret_add.state=my_match[1];
                    ret_add.zip=my_match[2];
                }
            }
            ret_add.street="";
            ret_add.city=splits[0].trim();
        }
        if(ret_add.city===undefined || ret_add.state===undefined || ret_add.zip===undefined)
        {
            to_parse=to_parse.replace(/\, ([\d]{5})\,? ([A-Z]{2})/, ", $2 $1");
            console.log("to_parse="+to_parse);
            var new_add=parseAddress.parseLocation(to_parse);
            ret_add.street="";
            if(new_add.number!==undefined)
            {
                ret_add.street=ret_add.street+new_add.number+" ";
            }
            ret_add.street=ret_add.street+new_add.street+" ";
            if(new_add.type!==undefined)
            {
                ret_add.street=ret_add.street+new_add.type;
            }
            ret_add.street=ret_add.street.trim();
            ret_add.city=new_add.city;
            ret_add.state=new_add.state;
            if(new_add.zip!==undefined) { ret_add.zip=new_add.zip; }
            else { ret_add.zip=""; }
            console.log("new_add="+JSON.stringify(new_add));
        }
        return ret_add;
    }
    function linkedin_response(response,resolve,reject) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        console.log("in linkedin_response");
//        for(var i in response) console.log("i="+i+", "+response[i]);
       console.log(response.finalUrl);
        var search;

        var b_algo;
     //   var g_stuff;
        var i;
       // var g1_success=false;
        var b_url="crunchbase.com", b_name;
        var b_top;
        var good_url;
        var lgb_info;
        var b_context;
        var b_factrow, b_caption;
        var b1_success=false, b_header_search, b_srtxt;

        try
        {
            search=doc.getElementById("b_content");
          //  console.log("search="+search);
         //   b_top=search.getElementById("lgb_info");



            b_algo=search.getElementsByClassName("b_algo");

            console.log(": b_algo.length="+b_algo.length);
            if(b_algo.length===0)
            {

                reject(JSON.stringify({error: true, errorText: "No URLs"}));
                return;
            }

            i=0;



            for(i=0; i < b_algo.length; i++)
            {

                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                if(b_url.indexOf("/company/")!==-1)
                {
                    b1_success=true;
                    break;
                }

            }
            if(b1_success)
            {
                console.log("Success. Found url="+b_url);
                GM_setValue("url",b_url);
                resolve(JSON.stringify({url: b_url}));
                return;
            }


        }
        catch(error)
        {

            console.log("Error "+error);
            reject(JSON.stringify({error: true, errorText: error}));
        }
        reject(JSON.stringify({error: true, errorText: "Could not find any urls"}));
    }

    function website_response(response,resolve,reject) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        console.log("in linkedin_response");
//        for(var i in response) console.log("i="+i+", "+response[i]);
       console.log(response.finalUrl);
        var search;

        var b_algo;
     //   var g_stuff;
        var i;
       // var g1_success=false;
        var b_url="crunchbase.com", b_name;
        var b_top;
        var good_url;
        var lgb_info;
        var b_context;
        var b_factrow, b_caption;
        var b1_success=false, b_header_search, b_srtxt;

        try
        {
            search=doc.getElementById("b_content");
          //  console.log("search="+search);
         //   b_top=search.getElementById("lgb_info");



            b_algo=search.getElementsByClassName("b_algo");

            console.log(": b_algo.length="+b_algo.length);
            if(b_algo.length===0)
            {

                reject(JSON.stringify({error: true, errorText: "No URLs"}));
                return;
            }

            i=0;



            for(i=0; i < b_algo.length; i++)
            {

                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                if(!is_bad_url(b_url,bad_urls))
                {
                    b1_success=true;
                    break;
                }

            }
            if(b1_success)
            {
                console.log("Success. Found url="+b_url);
                GM_setValue("url",b_url);
                resolve(JSON.stringify({url: b_url}));
                return;
            }


        }
        catch(error)
        {

            console.log("Error "+error);
            reject(JSON.stringify({error: true, errorText: error}));
        }
        reject(JSON.stringify({error: true, errorText: "Could not find any urls"}));
    }




    function linkedin_search(resolve,reject) {
        var search_str=my_query.name+" site:linkedin.com";
//        if(!first_try) google_search_str=google_search_str+" "+my_query.country;
        console.log("Searching with bing for "+search_str);
       var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
      // var domain_URL='https://www.google.com/search?q='+encodeURIComponent(search_str);//+" company");
        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             linkedin_response(response, resolve, reject);
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


            });
    }

        function website_search(resolve,reject) {
        var search_str=my_query.name;
//        if(!first_try) google_search_str=google_search_str+" "+my_query.country;
        console.log("Searching with bing for "+search_str);
       var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
      // var domain_URL='https://www.google.com/search?q='+encodeURIComponent(search_str);//+" company");
        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             linkedin_response(response, resolve, reject);
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


            });
    }
    function get_domain_only(the_url)
    {
        var httpwww_re=/https?:\/\/www\./;
        var http_re=/https?:\/\//;
        var slash_re=/\/.*$/;
        var ret=the_url.replace(httpwww_re,"").replace(http_re,"").replace(slash_re,"");
        return ret;
    }
    /* Following the finding the district stuff */
    function linkedin_promise_then(to_parse) {

        var search_str, search_URI, search_URIBing;
        console.log("to_parse="+to_parse);

    }



    function prefix_in_string(prefixes, to_check)
    {
        var j;
        for(j=0; j < prefixes.length; j++) {
            if(to_check.indexOf(prefixes[j])===0) return true;
        }
        return false;
    }
    function parse_name(to_parse)
    {
        var suffixes=["Jr","II","III","IV","CPA","CGM"];
        var split_parse=to_parse.split(" ");
        var last_pos=split_parse.length-1;
        var j;
        var caps_regex=/^[A-Z]+$/;
        var ret={};
        for(last_pos=split_parse.length-1; last_pos>=1; last_pos--)
        {
            if(!prefix_in_string(suffixes,split_parse[last_pos]) && !caps_regex.test(split_parse[last_pos])) break;

        }
        ret.lname=split_parse[last_pos];
        ret.fname=split_parse[0];
        if(last_pos>=2 && split_parse[1].length>=1) {
            ret.mname=split_parse[1].substring(0,1); }
        else {
            ret.mname=""; }
        return ret;

    }

    function init_Scraypestar()
    {
        var wT=document.getElementById("workContent").getElementsByTagName("table")[0];



        my_query={name: wT.rows[0].cells[1].innerText, doneLinkedIn: false, doneWebsite: false};


        var search_str, search_URI, search_URIBing;

        const linkedinPromise = new Promise((resolve, reject) => {
            console.log("Beginning yellow pages");
            linkedin_search(resolve, reject);
        });
        linkedinPromise.then(linkedin_promise_then
        )
        .catch(function(val) {
           console.log("Failed searching for linkedin " + val); GM_setValue("returnHit",true); });




        GM_addValueChangeListener("data",add_data_and_submit);


    }

    function add_data_and_submit()
    {
        var data=JSON.parse(GM_getValue("data"));
        if(data.location==="") data.location="N/A";
        document.getElementById("website_domain").value=data.company_url;
        document.getElementById("linkedin_company_url").value=data.url;
        document.getElementById("linkedin_company_name").value=data.name;
        document.getElementById("linkedin_company_industry").value=data.industry;
        document.getElementById("linkedin_company_location").value=data.location;
        document.getElementById("employees_number").value=data.employees;
        my_query.doneLinkedin=true;
        check_and_submit();
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

            init_Scraypestar();
        }

    }
    else if(window.location.href.indexOf("mturk.com")!==-1)
    {
       // console.log("In LuisQuintero main");
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
    else if(window.location.href.indexOf("linkedin.com")!==-1)
    {
        /* Load the file */
        console.log("On linkedin");
        var the_url=GM_getValue("url").replace(/\/$/,"");
        GM_addValueChangeListener("url", function() {
            var new_url=GM_getValue("url");
            window.location.replace(new_url);
        });
        //GM_setValue("donepage",false);
        if(window.location.href.indexOf(the_url)!==-1)
        {
            console.log("the url="+the_url+"\twindow we're in is "+window.location.href);
            setTimeout(scrape_page, 5000);
        }
        else
        {
            //window.location.replace(the_url);
        }
    }
    /* Scrape everything */
    function scrape_page()
    {
        var name="",comp_ind="", loc="", employees_txt, employees=0;
        var company_website="";
        var emp_match, emp_re=/See all ([\d]+) /;
        try
        {
            name=document.getElementsByClassName("org-top-card-module__name")[0].innerText;
            comp_ind=document.getElementsByClassName("company-industries")[0];
            company_website=document.getElementsByClassName("org-about-us-company-module__website")[0].href;
            if(comp_ind!==undefined) comp_ind=comp_ind.innerText;
            else comp_ind="";
            loc=document.getElementsByClassName("org-top-card-module__location")[0];
            if(loc!==undefined) { loc=loc.innerText; }
            else
            {
                loc="";
            }
            employees_txt=document.getElementsByClassName("org-company-employees-snackbar__see-all-employees-link")[0].innerText;
            console.log("employees_txt="+employees_txt);
            emp_match=employees_txt.match(emp_re);
            if(emp_match!==null)
            {
                employees=emp_match[1];
            }
            else
            {
                console.log("Failed to match employees on Linkedin thing");
            }
            var data={url: window.location.href, name: name, industry: comp_ind, location: loc, employees: employees, done: true, company_url: company_website};
            GM_setValue("data", JSON.stringify(data));
            console.log("Set data values");

        }
        catch(error) { console.log("Error is "+error); }
    }






})();