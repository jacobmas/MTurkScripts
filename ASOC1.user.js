// ==UserScript==
// @name         ASOC1
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Stuff about ASOC
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://*.facebook.com/*
// @include https://*.twitter.com/*
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
        document.getElementById("Email Address").value=document.getElementById("Email Address").value.replace("%20","").replace(/\?.*$/,"");
        if(automate)
            setTimeout(function() { document.getElementById("submitButton").click(); }, 1000);

    }
    function Twitter_response(response,resolve,reject) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        console.log("in domain_response");
        var search;

        var b_algo;
        //   var g_stuff;
        var i;

        var b_url="";
        var good_twitter_RegEx=/^https:\/\/twitter\.com\/[^\/]*$/;


        var b1_success=false, b_header_search;
        try
        {
            search=doc.getElementById("b_content");

            b_algo=search.getElementsByClassName("b_algo");

            i=0;
            for(i=0; i < b_algo.length; i++)
            {
                b_url=b_algo[i].getElementsByTagName("a")[0].href; // url of query
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
    }
    function Twitter_search(resolve,reject) {
        var bing_search_str;
        bing_search_str=my_query.district+" "+my_query.city+" "+my_query.state+" site:twitter.com";
        console.log("Searching with bing for "+bing_search_str);
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(bing_search_str)+"&first=1&rdr=1";
       // var domain_URL='https://www.google.com/search?q='+encodeURIComponent(google_search_str);//+" company");
        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             Twitter_response(response, resolve, reject);
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


            });
    }
    function FB_response(response,resolve,reject) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        console.log("in Facebook domain_response");
        var search;

        var b_algo;
        //   var g_stuff;
        var i;

        var b_url="";
        var FB_match="";
        var FB_re=/https:\/\/www\.facebook\.com\/[^\/]*/;

        var b1_success=false, b_header_search;
        try
        {
            search=doc.getElementById("b_content");

            b_algo=search.getElementsByClassName("b_algo");

            i=0;
            for(i=0; i < b_algo.length; i++)
            {
                b_url=b_algo[i].getElementsByTagName("a")[0].href; // url of query
                if(b_url.indexOf("facebook.com")!==-1 && b_url.indexOf("facebook.com/pages/")===-1) {
                    b1_success=true;
                    break;
                }


            }

            if(b1_success)
            {
                FB_match=b_url.match(FB_re);
                if(FB_match!==undefined && FB_match.length>0)
                {
                    console.log("Matched FB regex");
                    b_url=FB_match[0];
                }

                console.log("Found Facebook url " + b_url);

                GM_setValue("FBurl",b_url);
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
    }
    function FB_search(resolve,reject) {
        var bing_search_str;
        bing_search_str=my_query.district+" "+my_query.city+" "+my_query.state+" site:facebook.com";
        console.log("FB Searching with bing for "+bing_search_str);
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(bing_search_str)+"&first=1&rdr=1";
        // var domain_URL='https://www.google.com/search?q='+encodeURIComponent(google_search_str);//+" company");
        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,

            onload: function(response) {
                //   console.log("On load in crunch_response");
                //    crunch_response(response, resolve, reject);
                FB_response(response, resolve, reject);
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


        });
    }
   function Web_response(response,resolve,reject) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        console.log("in Web_response");
        var search;

        var b_algo;
     //   var g_stuff;
        var i;

        var b_url="crunchbase.com";

        var b1_success=false, b_header_search;
        try
        {
            search=doc.getElementById("b_content");

            b_algo=search.getElementsByClassName("b_algo");
            //search=doc.getElementById("search");
            //g_stuff=search.getElementsByClassName("g");
          //  var t_url="crunchbase.com", t_header_search="";
            i=0;
            while(b_url.indexOf("crunchbase.com") !== -1 || b_url.indexOf("linkedin.com") !== -1 ||
                  b_url.indexOf("bloomberg.com") !== -1 || b_url.indexOf("facebook") !== -1 ||
                b_url.indexOf("twitter.com") !== -1 || b_url.indexOf("manta.com")!==-1) {
                b_url=b_algo[i].getElementsByTagName("a")[0].href; // url of query
                console.log("b_url="+b_url);
                i++;
            }

            if(b_url!==null && b_url.length>0) {
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
    }
    function Web_search(resolve,reject) {
        var bing_search_str;
        bing_search_str=my_query.district+" "+my_query.city+" "+my_query.state+"";
        console.log("Searching with bing for "+bing_search_str);
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(bing_search_str)+"&first=1&rdr=1";
       // var domain_URL='https://www.google.com/search?q='+encodeURIComponent(google_search_str);//+" company");
        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             Web_response(response, resolve, reject);
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


            });
    }

    /* Search for website */
    function FB_promise_then(domain_name)
    {
        const WebPromise = new Promise((resolve, reject) => {
            console.log("Beginning website search");
            Web_search(resolve, reject);
        });
        WebPromise.then(function(url) {
            const TWPromise=new Promise((resolve,reject) => { console.log("Beginning Twitter search");
                                                             Twitter_search(resolve,reject); });

            TWPromise.then( function(val) { console.log("Found Twitter URL="+val); })
            .catch(function(val) { console.log("Could not find Twitter URL"); });


            console.log("Done with web query");
            document.getElementById("Website").value=url;
            my_query.doneWeb=true;
            if(my_query.doneFB && my_query.doneTwitter)
            {
                check_and_submit();
            }

        }
        )
        .catch(function(error) { console.log("Failed with website finding,"+error); });
    }

    function check_algo(b_algo, i, resolve, reject)
    {
        var b_url, b_header_search;
        try
        {
            b_url=b_algo[i].getElementsByTagName("a")[0].href; // url of query
            b_header_search=b_algo[i].firstChild.innerText; // basic description
            my_query.url=b_url;
        }
        catch(error)
        {
            reject("No more domains");
            return false;
        }
        if(my_query.url.substring(0,4)!=="http")
        {
            my_query.url="http://"+my_query.url;
        }
        my_query.url=my_query.url.replace(/\/$/,"");
        //GM_openInTab(my_query.url);
        /* Query for individual dude */

        console.log("Querying "+my_query.url);
        var search_URI=my_query.url;
        setTimeout(function() { GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URI,
            onload: function(response) {
                var found_email=find_email(response, resolve, reject);
                var curr_email=document.getElementById("Email Address").value;
                if(found_email && good_email(curr_email.toLowerCase()))
                {
                    resolve("Found email");
                    return true;
//                    check_and_submit();
                }
                else if(i < 2 && i+1 < b_algo.length)
                {
                    console.log("Checking search result "+(i+1));
                    return check_algo(b_algo, i+1,resolve,reject);
                }
                else
                {
                    console.log("curr_email="+curr_email);
                    //console.log("reject.toString="+reject);
                    reject("Couldn't find good email");
                }

            }

        });
                              }, 500);

    }
    function bing1_response(response,resolve, reject) {

        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        //console.log(doc.getElementsByTagName("body")[0]);

        //console.log("response.url="+response.finalUrl);
        var search=doc.getElementById("b_content");

        var b_algo=search.getElementsByClassName("b_algo");
        var i, b1_success=false, b_url="", b_header_search;
        var success=check_algo(b_algo,0,resolve,reject);
        /*if(success)
        {

            console.log("Success="+success);
            check_and_submit();
        }*/

    }



    function init_ASOC1()
    {
        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        var dist=wT.rows[0].cells[1].innerText;
        var promises_done=0;
        dist=dist.replace(/Dist$/,"District").replace("Dist ","District");
        my_query={district: dist, city: wT.rows[4].cells[1].innerText.trim(),state: wT.rows[3].cells[1].innerText.trim(),
                 doneWeb: false, doneFB: false, doneTwitter: false};
        console.log(JSON.stringify(my_query));
        GM_setValue("district",my_query.district);
        GM_setValue("city",my_query.city);
        GM_setValue("state",my_query.state);
        GM_setValue("FBurl","");
        GM_setValue("Twitterurl","");
        GM_setValue("FBstatus",0);
        GM_setValue("Twitterstatus",0);

        GM_addValueChangeListener("FBstatus",function(name, old_value, new_value, remote) {
            if(new_value === 2)
            {
                /* FB query is done */
                console.log("Done with FB query");
                var FBurl=GM_getValue("FBurl");
                var FBlikes=GM_getValue("FBlikes");

                document.getElementById("FacebookURL").value=FBurl;
                document.getElementById("FacebookLikes").value=FBlikes;
                my_query.doneFB=true;
                if(my_query.doneWeb && my_query.doneTwitter)
                {
                    check_and_submit();
                }
            }
        });
        GM_addValueChangeListener("Twitterstatus",function(name, old_value, new_value, remote) {
            if(new_value === 2)
            {
                /* FB query is done */
                console.log("Done with Twitter query");

                document.getElementById("TwitterURL").value=GM_getValue("Twitterurl");
                document.getElementById("TwitterFollowers").value=GM_getValue("TwitterFollowers");
                my_query.doneTwitter=true;
                if(my_query.doneWeb && my_query.doneFB)
                {
                    check_and_submit();
                }
            }
        });

        const FBPromise = new Promise((resolve, reject) => {
            console.log("Beginning Facebook search");
            FB_search(resolve, reject);
        });
        FBPromise.then(FB_promise_then
        )
        .catch(function(val) {

            console.log("Could not find FB URL");
        });





    }
    /* Initialize Twitter */
    function init_Twitter()
    {
        my_Twitter.status=GM_getValue("Twitterstatus",0);
        /* Add a listener for a new page */
        GM_addValueChangeListener("Twitterurl",function(name, old_value, new_value, remote) {
             my_Twitter.status=GM_getValue("Twitterstatus",0);
            console.log("in twitter url value change, new_value="+new_value);
            if(remote && my_Twitter.status==0 && new_value!=="")
            {
                //let search_input=document.getElementsByClassName("_1frb")[0];
                //let FBsearch_button=document.getElementsByClassName("_4w97")[0];
                //let search_URI="https://www.facebook.com/search/pages/?q="+encodeURIComponent(search_input);
                //search_input.value=new_value.district;
                /* Go to the page */
                GM_setValue("Twitterstatus",1); // parsing the page
                window.location.replace(new_value);


            }
        });
        if(my_Twitter.status==1)
        {
            console.log("myTwitter.status="+my_Twitter.status);
            setTimeout(parse_Twitter, 2000);
        }

    }

    /* Check if it's a good page */
    function parse_Twitter()
    {
        var city=GM_getValue("city"), state=GM_getValue("state");

        var split_address;
        try
        {
            split_address=document.getElementsByClassName("ProfileHeaderCard-locationText")[0].split(",");


            if(split_address.length!==2 || split_address[0].trim()!==city || split_address[1].trim()!==state)
            {
                GM_setValue("FBstatus",-1);
                return;
            }
            /* Set the likes */
            var followers_nav=document.getElementsByClassName("ProfileNav-item--followers")[0];
            var TwitterFollowers=followersNav.getElementsByClassName("ProfileNav-value")[0].dataset.count;
            console.log("TwitterFollowers="+TwitterFollowers);

            GM_setValue("TwitterFollowers",TwitterFollowers);
            GM_setValue("Twitterstatus", 2); /* Done */
            return;

        }
        catch(error) {
            console.log("Error in parse Twitter " + error);
            GM_setValue("Twitterstatus",-1);
            return;
        }
    }

    /* Determine whether we are on searching pages, or an actual page */
    function init_Facebook()
    {
        console.log("Initializing Facebook");
        my_FB.status=GM_getValue("FBstatus",0);
        /* Add a listener for a new page */
        GM_addValueChangeListener("FBurl",function(name, old_value, new_value, remote) {
             my_FB.status=GM_getValue("FBstatus",0);
            console.log("in FB url value change, new_value="+new_value+" my_FB.status="+my_FB.status);
            console.log(GM_getValue("FBurl"));
            if(my_FB.status==0 && new_value !== "")
            {
                console.log("Changing windows");
                //let search_input=document.getElementsByClassName("_1frb")[0];
                //let FBsearch_button=document.getElementsByClassName("_4w97")[0];
                //let search_URI="https://www.facebook.com/search/pages/?q="+encodeURIComponent(search_input);
                //search_input.value=new_value.district;
                /* Go to the page */
                GM_setValue("FBstatus",1); // parsing the page
                window.location.replace(new_value);


            }
        });
        if(my_FB.status==1)
        {
                        console.log("myFB.status="+my_FB.status);

            setTimeout(parse_FB, 2000);
        }

    }

    /* Check if it's a good page */
    function parse_FB()
    {
        console.log("Parsing FB");
        var city=GM_getValue("city"), state=GM_getValue("state");
        console.log("city="+city+", state="+state);
        var unofficial_elem=document.getElementById("u_0_5");
        var address;
        if(unofficial_elem===undefined || unofficial_elem===null)
        {
            /* Bad page */
            console.log("Bad page");
            GM_setValue("FBstatus",-1);
            return;
        }
        try
        {
            let add=document.getElementsByClassName("_2wzd")[0];
            var parsed = parseAddress.parseLocation(add.innerText);
            var FBlikes;
            console.log(JSON.stringify(parsed));
            console.log("state_map="+full_state_map[state]);
            console.log("city.toLowerCase="+city.toLowerCase()+", parsed.city.toLowerCase()="+parsed.city.toLowerCase());
            console.log("parsed.state=full_state_map[state]: " + (parsed.state===full_state_map[state]));
            console.log("city.toLowerCase=parsed.city.toLowerCase: "+(parsed.city.toLowerCase()===city.toLowerCase()));
            if(parsed.city.toLowerCase()!==city.toLowerCase() || full_state_map[state]!==parsed.state)
            {
                        console.log("City parse error");

                GM_setValue("FBstatus",-1);
                return;
            }
            console.log("City parse success?");
            /* Set the likes */
            var community_stuff=document.getElementsByClassName("_6590")[0];
            var likes_div=community_stuff.getElementsByClassName("_4bl9")[1];
            FBlikes=likes_div.innerText.split(" ")[0].replace(/\,/,"");
            console.log("FBlikes="+FBlikes);
            GM_setValue("FBlikes",FBlikes);
            GM_setValue("FBstatus", 2); /* Done */
            return;

        }
        catch(error) {
            console.log("Error in parse FB " + error);
            GM_setValue("FBstatus",-1);
            return;
        }
    }

    if (window.location.href.indexOf("mturkcontent.com") !== -1 || window.location.href.indexOf("amazonaws.com") !== -1)
    {
        var submitButton=document.getElementById("submitButton");
        if(!submitButton.disabled )
        {

            init_ASOC1();
        }

    }
    else if(window.location.href.indexOf("facebook.com")!==-1)
    {
        init_Facebook();
    }
    else if(window.location.href.indexOf("twitter.com")!==-1)
    {
        init_Twitter();
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