// ==UserScript==
// @name         JennaMasuda
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Stuff about JJNissen
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include file://*
// @grant        GM_setClipboard
// @grant GM_xmlhttpRequest
// @connect google.com
// @connect bing.com
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// ==/UserScript==

(function() {
    'use strict';

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
            t_url=g_stuff[i].getElementsByTagName("cite")[0].innerText; // url of query
            t_header_search=g_stuff[i].getElementsByClassName("r")[0].innerText; // basic description
            if(t_url.indexOf("https://www.linkedin.com/company/")===0)
            {
                g1_success=true;
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
            var search_str=company_name+" "+my_query.fname+" "+my_query.lname+" Linkedin";
            var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);
            GM_xmlhttpRequest({
                method: 'GET',
                url:    search_URI,

                onload: function(response) {

                    google2_response(response, my_query); }

            });
        }
    }

    /* Get company name */
    function bing1_response(response,my_query) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        var search=doc.getElementById("b_content");

        var b_algo=search.getElementsByClassName("b_algo");
        var i, b1_success=false, b_url="", b_header_search;
        for(i=0; i < b_algo.length; i++)
        {
            b_url=b_algo[i].getElementsByTagName("cite")[0].innerText; // url of query
            b_header_search=b_algo[i].firstChild.firstChild.innerText; // basic description
            if(b_url.indexOf("https://www.linkedin.com/company/")===0)
            {
                b1_success=true;
                break;
            }

        }
        if(b1_success)
        {
            /* Continue */
            var company_name="", t_split = b_header_search.split(/( - )|(\|)|(,)/g);
            if(t_split!== null && t_split.length>0) company_name=t_split[0].trim();
            document.getElementsByName("Company Name")[0].value=company_name;
            my_query.company_name=company_name;
            /* Query for individual dude */
            var search_str=company_name+" "+my_query.fname+" "+my_query.lname+" Linkedin";
            var search_URI='https://www.bing.com/search?q='+encodeURIComponent(search_str);
            GM_xmlhttpRequest({
                method: 'GET',
                url:    search_URI,

                onload: function(response) {

                    bing2_response(response, my_query); }

            });
        }
    }

    /* Get the head of the company */
    function google2_response(response,my_query) {
        //console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        var search=doc.getElementById("search");

        var g_stuff=search.getElementsByClassName("g");
        var i;
        var g1_success=false;
        var t_url="", t_header_search="";
        for(i=0; i < g_stuff.length; i++)
        {
            t_url=g_stuff[i].getElementsByTagName("cite")[0].innerText; // url of query
            t_header_search=g_stuff[i].getElementsByClassName("r")[0].innerText; // basic description
            if(t_url.indexOf("https://www.linkedin.com/in/")===0)
            {
                g1_success=true;
                break;
            }
            //console.log(temp1);
        }
        if(g1_success)
        {
            document.getElementsByName("LinkedIn Address")[0].value=t_url;
            var search_str=my_query.company_name+" ";//+my_query.streetadd;//
            if(my_query.streetadd.length==0) search_str=search_str+" corporate";
            search_str=search_str+" address";

            var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);//+"?ei=tuC2Wu9awZ3nApPrpOgB";
            var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str);//+"?ei=tuC2Wu9awZ3nApPrpOgB";

            GM_xmlhttpRequest({
                method: 'GET',
                url:    search_URIBing,

                onload: function(response) {
                    console.log("Beginning Bing3\nURI="+search_URIBing);
                     //google3_response(response, my_query);
                    bing3_response(response, my_query);
                               }

            });
        }
    }

    function bing2_response(response,my_query) {
        //console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        var search=doc.getElementById("b_content");

        var b_algo=search.getElementsByClassName("b_algo");
        var i, b1_success=false, b_url="", b_header_search;
        for(i=0; i < b_algo.length; i++)
        {
            b_url=b_algo[i].getElementsByTagName("cite")[0].innerText; // url of query
            b_header_search=b_algo[i].firstChild.firstChild.innerText; // basic description
            if(b_url.indexOf("https://www.linkedin.com/in/")===0)
            {
                b1_success=true;
                break;
            }
            //console.log(temp1);
        }
        if(b1_success)
        {
            document.getElementsByName("LinkedIn Address")[0].value=b_url;
            var search_str=my_query.company_name+" "+ my_query.streetadd;//+" address";;//+my_query.streetadd;//


            var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);//+"?ei=tuC2Wu9awZ3nApPrpOgB";
            var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str);//+"?ei=tuC2Wu9awZ3nApPrpOgB";

            GM_xmlhttpRequest({
                method: 'GET',
                url:    search_URIBing,

                onload: function(response) {
                    console.log("Beginning Bing3\nURI="+search_URIBing);
                     //google3_response(response, my_query);
                    bing3_response(response, my_query);
                               }

            });
        }
    }
    /* Do phone and address */
    function google3_response(response,my_query) {

        //console.log(response.responseText);
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        var phoneAddress;

        var field_names=doc.getElementsByClassName("w8qArf");
        var result_names=doc.getElementsByClassName("LrzXr");


        var i;
        var added_stuff=0;
        console.log("field_names.length="+field_names.length);
        document.getElementsByName("Country")[0].value="US";
        for(i=0; i < field_names.length; i++) {
            if(field_names[i].firstChild.innerText==="Address")
            {
                /* parse the address of equivalent in result names */
                try
                {
                    var parsed = parseAddress.parseLocation(field_names[i].nextSibling.innerText);
                    document.getElementsByName("City")[0].value=parsed.city;
                    document.getElementsByName("State")[0].value=parsed.state;
                    document.getElementsByName("Zip/Postal Code")[0].value=parsed.zip;

                    added_stuff+=1;
                }
                catch(error)
                {
                    console.log("Error:" + error);
                }
            }
            else if(field_names[i].firstChild.innerText==="Phone")
            {
                document.getElementsByName("Corporate Phone")[0].value=field_names[i].nextSibling.innerText;
                added_stuff+=1;
            }
        }

        var other=doc.getElementsByClassName("Z0lcw");
        if(other!==null && other.length>0)
        {
            console.log(other[0].innerText);
        }
        if(field_names.length>0 && added_stuff>=2)
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 1000);

        }
        else {


            var web_url=document.getElementsByName("web_url")[0];
            web_url.nextSibling.nextSibling.nextSibling.nextSibling.innerHTML="Corporate Phone: FAIL1";
            var search_str=my_query.company_name+" " + my_query.streetadd+" address";

            var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);//+"?ei=tuC2Wu9awZ3nApPrpOgB";
           // var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str);//+"?ei=tuC2Wu9awZ3nApPrpOgB";

            GM_xmlhttpRequest({
                method: 'GET',
                url:    search_URI,

                onload: function(response) {
                    console.log("Beginning Google4\nURI="+search_URI);
                     google4_response(response, my_query);
                               }

            });
        }
      
    }

    /* Do phone and address */
    function bing3_response(response,my_query) {
        //console.log(response.responseText);
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        var phoneAddress;
        var field_names=doc.getElementsByClassName("cbl");
        var i;
        var added_stuff=0;
        console.log("field_names.length="+field_names.length);
        document.getElementsByName("Country")[0].value="US";
        for(i=0; i < field_names.length; i++) {
            if(field_names[i].innerText==="Address:")
            {
                console.log("Found address, nextsibling is"+field_names[i].nextSibling.nextSibling);

                /* parse the address of equivalent in result names */
                try
                {
                    var parsed = parseAddress.parseLocation(field_names[i].nextSibling.nextSibling.innerText);
                    document.getElementsByName("City")[0].value=parsed.city;
                    document.getElementsByName("State")[0].value=parsed.state;
                    document.getElementsByName("Zip/Postal Code")[0].value=parsed.zip;
                    added_stuff+=1;

                }
                catch(error)
                {
                    console.log("Error re rightbox:" + error);



                }
            }
            else if(field_names[i].innerText==="Phone:")
            {
                console.log("Found address, nextsibling is"+field_names[i].nextSibling.textContent);

                document.getElementsByName("Corporate Phone")[0].value=field_names[i].nextSibling.textContent;
                added_stuff+=1;
            }
        }

        if(field_names.length>0 && added_stuff>=2)
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 1000);
            return;
        }
        field_names=doc.getElementById("lgb_info");
        if(field_names!==null)
        {
            try
            {
                field_names=field_names.getElementsByClassName("b_factrow");
            var parsed2 = parseAddress.parseLocation(field_names[1].innerText);
            document.getElementsByName("City")[0].value=parsed2.city;
            document.getElementsByName("State")[0].value=parsed2.state;
            document.getElementsByName("Zip/Postal Code")[0].value=parsed2.zip;
            added_stuff+=1;
            document.getElementsByName("Corporate Phone")[0].value=field_names[2].innerText;
            added_stuff+=1;
            }
            catch(error)
            {
                console.log("error re otherbox: "+error);
            }
        }
        if(field_names!==null && field_names.length>0 && added_stuff>=2)
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 1000);
            return;
        }
        else {


            var web_url=document.getElementsByName("web_url")[0];
            web_url.nextSibling.nextSibling.nextSibling.nextSibling.innerHTML="Corporate Phone: FAIL1";
            var search_str=my_query.company_name+" corporate address";

            var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);//+"?ei=tuC2Wu9awZ3nApPrpOgB";
            var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str);//+"?ei=tuC2Wu9awZ3nApPrpOgB";

            GM_xmlhttpRequest({
                method: 'GET',
                url:    search_URIBing,

                onload: function(response) {
                    console.log("Beginning Bing4\nURI="+search_URI);
                     bing4_response(response, my_query);
                               }

            });
        }

    }

    function google4_response(response,my_query) {

        //console.log(response.responseText);
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        var phoneAddress;

        var field_names=doc.getElementsByClassName("w8qArf");
        var result_names=doc.getElementsByClassName("LrzXr");


        var i;
        var added_stuff=0;
        console.log("field_names.length="+field_names.length);
        document.getElementsByName("Country")[0].value="US";
        for(i=0; i < field_names.length; i++) {
            if(field_names[i].firstChild.innerText==="Address")
            {
                /* parse the address of equivalent in result names */
                try
                {

                    var parsed = parseAddress.parseLocation(field_names[i].nextSibling.innerText);
                    document.getElementsByName("City")[0].value=parsed.city;
                    document.getElementsByName("State")[0].value=parsed.state;
                    document.getElementsByName("Zip/Postal Code")[0].value=parsed.zip;

                    added_stuff+=1;
                }
                catch(error)
                {
                    console.log("Error:" + error);
                }
            }
            else if(field_names[i].firstChild.innerText==="Phone")
            {


                document.getElementsByName("Corporate Phone")[0].value=field_names[i].nextSibling.innerText;
                added_stuff+=1;
            }
        }

        var other=doc.getElementsByClassName("Z0lcw");
        if(other!==null && other.length>0)
        {
            console.log(other[0].innerText);
        }
        if(field_names.length>0 && added_stuff>=2)
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 1000);

        }
        else {


            var web_url=document.getElementsByName("web_url")[0];
            web_url.nextSibling.nextSibling.nextSibling.nextSibling.innerHTML="Corporate Phone: FAIL2";
            var search_str=my_query.company_name+" "+my_query.streetadd;

            var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);//+"?ei=tuC2Wu9awZ3nApPrpOgB";


        }

    }
    function bing4_response(response,my_query) {

        //console.log(response.responseText);
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        var phoneAddress;

        var field_names=doc.getElementsByClassName("cbl");
       // var result_names=doc.getElementsByClassName("LrzXr");


        var i;
        var added_stuff=0;
        console.log("field_names.length="+field_names.length);
        document.getElementsByName("Country")[0].value="US";
        for(i=0; i < field_names.length; i++) {
            if(field_names[i].innerText==="Address:")
            {
                /* parse the address of equivalent in result names */
                try
                {
                    console.log("Found address");
                    var parsed = parseAddress.parseLocation(field_names[i].nextSibling.nextSibling.innerText);
                    document.getElementsByName("City")[0].value=parsed.city;
                    document.getElementsByName("State")[0].value=parsed.state;
                    document.getElementsByName("Zip/Postal Code")[0].value=parsed.zip;

                    added_stuff+=1;
                }
                catch(error)
                {
                    console.log("Error:" + error);
                }
            }
            else if(field_names[i].innerText==="Phone:")
            {
                document.getElementsByName("Corporate Phone")[0].value=field_names[i].nextSibling.textContent;
                added_stuff+=1;
            }
        }

        var other=doc.getElementsByClassName("Z0lcw");
        if(other!==null && other.length>0)
        {
            console.log(other[0].innerText);
        }
        if(field_names.length>0 && added_stuff>=2)
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 1000);

        }
        else {


            var web_url=document.getElementsByName("web_url")[0];
            web_url.nextSibling.nextSibling.nextSibling.nextSibling.innerHTML="Corporate Phone: FAIL2";
            var search_str=my_query.company_name+" "+my_query.streetadd;

            var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);//+"?ei=tuC2Wu9awZ3nApPrpOgB";


        }

    }
    function paste_city(e)
    {
        e.preventDefault();
        var text=e.clipboardData.getData("text/plain");        var re=/([A-Za-z0-9\s]+)\s*,\s*([A-Za-z\s]+)\s*([\d\-]+)/;
        var result = re.exec(text);
        if(result !== null)
        {
           document.getElementsByName("City")[0].value=result[1];
            document.getElementsByName("State")[0].value=result[2];
            document.getElementsByName("Country")[0].value="US";
            document.getElementsByName("Zip/Postal Code")[0].value=result[3];
        }
        else
        {
            document.getElementsByName("City")[0].value=text;
        }
    }

    function init_JennaMasuda()
    {
        var workTable=document.getElementById("workContent").getElementsByTagName("table")[0];

        var fname, lname, email, domain, streetadd;

        var atpos;

        fname=workTable.rows[0].cells[1].innerText;
        lname=workTable.rows[1].cells[1].innerText;
        email=workTable.rows[2].cells[1].innerText;
        streetadd=workTable.rows[3].cells[1].innerText;
        atpos = email.indexOf("@");
        domain=email.substr(atpos+1);

        var web_url=document.getElementsByName("web_url")[0];
        web_url.value="http://www."+domain;

    
        var search_str=domain + " Linkedin";

        // Put into one object/map thing
        var my_query = {fname: fname, lname: lname, domain: domain, streetadd: streetadd};
                        
      
        var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);

        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str);
            //console.log(search_URI);

        document.getElementsByName("City")[0].addEventListener("paste",paste_city);


        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,

            onload: function(response) {

                bing1_response(response, my_query); }

        });
        
    }


    var submitButton=document.getElementById("submitButton");
    if(!submitButton.disabled)
    {
        document.getElementsByName("City")[0].value="";
        document.getElementsByName("State")[0].value="";
        document.getElementsByName("Zip/Postal Code")[0].value="";
        document.getElementsByName("Country")[0].value="";
        document.getElementsByName("Corporate Phone")[0].value="";
        init_JennaMasuda();
    }



})();