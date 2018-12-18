// ==UserScript==
// @name         KeithFriedmanGood
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
    var bad_urls=["www.dandb.com","www.yellowpages.com","www.healthgrades.com","www.vitals.com",
                 "www.chamberofcommerce.com","www.usahealthcareguide.com","local.yahoo.com",
                 "npiprofile.com","www.wellness.com","www.healthcare4ppl.com","www.buzzfile.com","www.mapquest.com",
                 "npidb.org","www.yelp.com","www.facebook.com","www.healthgrades.com","www.ehealthscores.com",
                 "www.bizapedia.com","masslive.com","hub.biz","www.indeed.com"];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;
    function is_bad_url(the_url) {

        var i;
        console.log("the_url="+the_url);
        var bad_url_re=/https?:\/\/[^\/]*\/[^\/]*\/.+/;
        if(bad_url_re.test(the_url)) return true;
        for(i=0; i < bad_urls.length; i++)
        {
            if(the_url.indexOf(bad_urls[i])!==-1) {
                return true; }
        }
        return false;
    }
    function prefix_in_string(prefixes, to_check)
    {
        var j;
        for(j=0; j < prefixes.length; j++)
        {
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
        if(last_pos>=2 && split_parse[1].length>=1)
            ret.mname=split_parse[1].substring(0,1);
        else
            ret.mname="";
        return ret;

    }
    function done_hit()
    {
        return my_query.found_email && my_query.found_phone && my_query.found_url;
    }



    function bing1_response(response) {

        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        //console.log(doc.getElementsByTagName("body")[0]);

        //console.log("response.url="+response.finalUrl);
        var search=doc.getElementById("b_content");

        var b_algo=search.getElementsByClassName("b_algo");
        var i, b1_success=false, b_url="", b_header_search;

        //console.log("b_algo.length="+b_algo.length);
       // var b_algoheader=search.getElementsByClassName("b_algoheader");
        for(i=0; i < b_algo.length; i++)
        {
            b_url=b_algo[i].getElementsByTagName("a")[0].href; // url of query
            if(!is_bad_url(b_url))
            {
                b_header_search=b_algo[i].firstChild.innerText; // basic description
                b1_success=true;
                my_query.url=b_url;
                if(my_query.url.substring(0,4)!=="http")
                {
                    my_query.url="http://"+my_query.url;
                }
                my_query.url=my_query.url.replace(/(https?:\/\/[^\/]*)(\/.*)$/,"$1");
                console.log("after replace url="+my_query.url);
                //GM_openInTab(my_query.url);
                /* Query for individual dude */

                my_query.found_url=true;
                if(done_hit())
                {
                    check_and_submit();
                    return;
                }
                setTimeout(function() {
                    console.log("Querying "+my_query.url);
                    var search_URI=my_query.url;
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url:    search_URI,
                        onload: function(response) {
                            webpage_response(response, my_query); }

                    });
                },10);
                return;
            }
            else
            {
                console.log("i="+i+", bad url "+b_url);
            }


        }
        if(b1_success)
        {
            console.log("Found a url successfully");
        }
        else
        {
            /* Do something */
            console.log("Failed in bing1_response");
            if(my_query.found_email && my_query.found_phone)
            {
                var the_domain=my_query.email.replace(/^(.*@)/,"");
                my_query.url="http://www."+the_domain;
                my_query.found_url=true;
                if(done_hit())
                {
                    check_and_submit();
                    return;
                }
            }

            GM_setValue("returnHit",true);
        }
    }

    function google1_response(response) {
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
            console.log("i="+i+" in Google search.");
            try
            {
                var email_match=g_stuff[i].innerText.match(email_re);
                if(email_match!==null && email_match!==undefined && email_match.length>0 &&
                  email_match.indexOf("@"+get_domain_only(my_query.url)))
                {
                    my_query.email=email_match[0];
                    my_query.found_email=true;
                    if(done_hit())
                    {
                        console.log("Found email via googling");
                        check_and_submit();
                        return;
                    }
                }


                //t_url=g_stuff[i].getElementsByTagName("a")[0].href; // url of query
                //t_header_search=g_stuff[i].getElementsByClassName("r")[0].innerText; // basic description
//                g1_success=true;

            }
            catch(error)
            {
                console.log("ERROR "+error);
                break;
            }

            //console.log(temp1);
        }
        if(g1_success)
        {
            /* Continue */





        }
        else
        {
            console.log("g1 Fail");
            GM_setValue("returnHit",true);
        }
    }
    function webpage_response(response) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var i;
        var contact_href;
        var the_content;
       //console.log(doc.body.innerHTML);
        var email_match=doc.body.innerHTML.match(email_re);
        var phone_match=doc.body.innerHTML.match(phone_re);
        var raw_url_match=my_query.url.match(/https?:\/\/[^\/]*/);
        var raw_url="";
        if(raw_url_match!==null && raw_url_match.length>0)
        {
            raw_url=raw_url_match[0];
            console.log("raw_url_match[0]="+raw_url_match[0]);
        }
        if(!my_query.found_email && email_match!==null && email_match.length>0)
        {
            console.log("Email found");
            my_query.email=email_match[0];
            my_query.found_email=true;
            if(done_hit()) {
                check_and_submit();
                return;
            }
            //check_and_submit();
            //return;
        }
        if(!my_query.found_phone && phone_match!==null && phone_match.length>0)
        {
             console.log("Phone found");
            my_query.phone=phone_match[0];
            my_query.found_phone=true;
            if(done_hit()) {
                check_and_submit();
                return;
            }
            //check_and_submit();
            //return;
        }
        //console.log(doc.body.innerHTML);
        for(i=0; i < doc.links.length; i++)
        {
            the_content=doc.links[i].textContent.toLowerCase();
           //console.log("doc.links["+i+"].textContent="+doc.links[i].textContent);
            if(the_content.indexOf("contact")!==-1)
            {
                contact_href=doc.links[i].href;
                if(contact_href.indexOf("https://www.mturkcontent.com")==0 ||
                  contact_href.indexOf("https://s3.amazonaws.com")==0)
                {

                    contact_href=contact_href.replace("https://www.mturkcontent.com/dynamic",raw_url).replace("https://www.mturkcontent.com",raw_url);
                    contact_href=contact_href.replace("https://s3.amazonaws.com",raw_url);
                    console.log("contact_href="+contact_href);
                }
                 console.log("Found contact "+contact_href);

                GM_xmlhttpRequest({
                    method: 'GET',
                    url:    contact_href,

                    onload: function(response) {

                        check_contacts(response, my_query); }

                });
                return;
            }
        }
        console.log("Found no contacts, last ditch attempt");
        try_googling();
    }

    function try_googling()
    {
        var the_domain=get_domain_only(my_query.url);

        var search_str="email @"+the_domain;
        var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);
        console.log("search_URI="+search_URI);
        GM_xmlhttpRequest({
                method: 'GET',
                url:    search_URI,

                onload: function(response) {

                    google1_response(response);
                }

            });

    }

    function check_contacts(response,my_query) {
        console.log("In check_contacts");
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var email_match=doc.body.innerHTML.match(email_re);
        var phone_match=doc.body.innerHTML.match(phone_re);
       // console.log("doc.body.innerHTML="+doc.body.innerHTML);
        if(!my_query.found_email && email_match!==null && email_match.length>0)
        {
            console.log("Email found");
            my_query.email=email_match[0];
            my_query.found_email=true;
            if(done_hit()) {
                check_and_submit();
                return;
            }
            //check_and_submit();
            //return;
        }
        if(!my_query.found_phone && phone_match!==null && phone_match.length>0)
        {
             console.log("Phone found");
            my_query.phone=phone_match[0];
            my_query.found_phone=true;
            if(done_hit()) {
                check_and_submit();
                return;
            }
            //check_and_submit();
            //return;
        }

        console.log("Email/phone not all found, last ditch attempt");
        try_googling();
    }


    function init_KeithFriedman()
    {
        var wT=document.getElementById("workContent").getElementsByTagName("table")[0];

        var name,fname, lname, email, domain, place="";
        var city_field;
        var atpos;
        var name_split;
        var name_ret;




       my_query = {name: wT.rows[0].cells[1].innerText, address: wT.rows[1].cells[1].innerText,
                   city: wT.rows[2].cells[1].innerText, state: wT.rows[3].cells[1].innerText,
                   phone: wT.rows[4].cells[1].innerText, email: wT.rows[5].cells[1].innerText,
                   url: wT.rows[6].cells[1].innerText, found_phone: false, found_email: false, found_url: false};

        if(my_query.phone.length>0) my_query.found_phone=true;
        if(my_query.email.length>0) my_query.found_email=true;
        if(my_query.url.length>0) my_query.found_url=true;

        var search_str=my_query.name+" "+my_query.city+" "+my_query.state;


        var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);

        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
        console.log(search_URI);

        console.log(search_URIBing);

        GM_setClipboard(search_URI);


        if(my_query.url.indexOf("http")!==-1)
        {
            GM_xmlhttpRequest({
                        method: 'GET',
                        url:    my_query.url,
                        onload: function(response) {
                            webpage_response(response); }

                    });
        }
        else
        {
            GM_xmlhttpRequest({
                method: 'GET',
                url:    search_URIBing,

                onload: function(response) {

                    bing1_response(response);
                }

            });
        }

    }

 
    function check_and_submit()
    {
        console.log("Checking and submitting");
        if(!done_hit())

        {
            GM_setValue("returnHit",true);
            return;
        }
        document.getElementById("web_tel").value=my_query.phone;
        document.getElementById("web_email").value=my_query.email;
        document.getElementById("web_url").value=my_query.url;

        if(automate)
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 0);
        }
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
  
  
    function get_domain_only(the_url)
    {
        var httpwww_re=/https?:\/\/www\./;
        var http_re=/https?:\/\//;
        var slash_re=/\/.*$/;
        var ret=the_url.replace(httpwww_re,"").replace(http_re,"").replace(slash_re,"");
        return ret;
    }
    /* Following the finding the district stuff */
   

  

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

            init_KeithFriedman();
        }

    }
    else
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


})();