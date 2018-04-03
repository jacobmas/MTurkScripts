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
    var state_list=["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY",
                    "LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH",
                    "OK","OR","PA","PR","RI","SC","SD","TN","TX","UT","VT","VA","VI","WA","WV","WI","WY"];
    var prov_list=["ON","QC"];
    /* Parses the address, deals with Canada */
    function parseAddressStuff(address)
    {
        var parsed = parseAddress.parseLocation(address);
        if(parsed.city===undefined)
        {
            var add_split=address.split(", ");
            var len=add_split.length;
            if(add_split[len-1].trim()==="Canada" && len>=3)
            {
                document.getElementsByName("City")[0].value=add_split[len-3];
                document.getElementsByName("State")[0].value=add_split[len-2].substr(0,2);
                document.getElementsByName("Zip/Postal Code")[0].value=add_split[len-2].substr(3);
                document.getElementsByName("Country")[0].value="US";
                //alert("CANADATIME");
                return true;
            }
            else
            {
                console.log("NOT CANADA\n\n");
            }
            return false;

        }
        else
        {
            document.getElementsByName("City")[0].value=parsed.city;
            document.getElementsByName("State")[0].value=parsed.state;
            document.getElementsByName("Zip/Postal Code")[0].value=parsed.zip;
            document.getElementsByName("Country")[0].value="US";
            return true;
        }
    }

    function check_and_submit()
    {

        var city=document.getElementsByName("City")[0].value;
        var state=document.getElementsByName("State")[0].value;
        var zip=document.getElementsByName("Zip/Postal Code")[0].value;



        if(city==="" || state==="" || zip==="" || city==="undefined" || state ==="undefined" ||
           zip==="undefined" || city.length<1)
        {
            document.getElementsByClassName("panel-heading")[0].firstChild.innerHTML="<strong>BAD ADDRESS</strong>";
            GM_setValue("returnHit",false);
            return;
        }
        else if(!state_list.includes(state))
        {
            document.getElementsByClassName("panel-heading")[0].firstChild.innerHTML="<strong>BAD STATE</strong>";
            GM_setValue("returnHit",true);
            return;
        }
        else if(document.getElementsByName("LinkedIn Address")[0].value==="Does not exist")
        {
            document.getElementsByClassName("panel-heading")[0].firstChild.innerHTML="<strong>CONFIRM NONEXISTENCE</strong>";
            GM_setValue("returnHit",true);
            return;
        }
        else
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 1000);
        }
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
                        console.log("temp_split.length="+temp_split.length);
                        console.log("temp_split="+temp_split);
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
        console.log(doc.getElementsByTagName("body")[0]);

        console.log("response.url="+response.finalUrl);
        var search=doc.getElementById("b_content");

        var b_algo=search.getElementsByClassName("b_algo");
        var i, b1_success=false, b_url="", b_header_search;

        console.log("b_algo.length="+b_algo.length);
       // var b_algoheader=search.getElementsByClassName("b_algoheader");
        for(i=0; i < b_algo.length; i++)
        {
            b_url=b_algo[i].getElementsByTagName("cite")[0].innerText; // url of query
            b_header_search=b_algo[i].firstChild.innerText; // basic description
             var x=b_url.match(/https:\/\/.*\.linkedin\.com\/company\//);
            if(x!==undefined && x!== null && x.length>0)
            {
                console.log("b_url="+b_url+"\nb_header="+b_header_search);
                b1_success=true;
                break;
            }
            else
            {
                console.log("b_url="+b_url);
            }

        }
        if(b1_success)
        {
            /* Continue */
            var company_name="", t_split = b_header_search.split(/(\s-\s)|(\|)|(,)/g);
            if(t_split!== null && t_split.length>0) company_name=t_split[0].trim();
            document.getElementsByName("Company Name")[0].value=company_name;
            my_query.company_name=company_name;
            console.log("my_query.company_name="+my_query.company_name);
            /* Query for individual dude */
            var search_str=company_name+" "+my_query.fname+" "+my_query.lname+" Linkedin";
            var search_URI='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
            GM_xmlhttpRequest({
                method: 'GET',
                url:    search_URI,

                onload: function(response) {

                    bing2_response(response, my_query); }

            });
        }
        else
        {
            console.log("b1 Fail");
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
                        console.log("temp_split.length="+temp_split.length);
                        console.log("temp_split="+temp_split);
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
                        return;
                    }

                    document.getElementsByName("Company Name")[0].value=my_query.company_name;
                    /* Query for individual dude */
                    var search_str=my_query.company_name+" "+my_query.fname+" "+my_query.lname+" Linkedin";
                    var search_URI='https://www.bing.com/search?q='+encodeURIComponent(search_str);
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url:    search_URI,

                        onload: function(response) {

                            bing2_response(response, my_query); },
                        onerror: function(response) { GM_setValue("returnHit",true); },
                        ontimeout: function(response) { GM_setValue("returnHit",true); },
                        onabort: function(response) { GM_setValue("returnHit",true); }


                    });
                }

            });
        }
    }

    /* Get the head of the company */
    function google2_response(response,my_query) {
        //console.log(JSON.stringify(response));
        console.log("Google2 response");
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
            var x=t_url.match(/https:\/\/.*\.linkedin\.com\/in\//);
            if(x !== undefined && x!== null && x.length>0)
            {
                g1_success=true;
                break;
            }
            //console.log(temp1);
        }
        if(g1_success)
        {
            document.getElementsByName("LinkedIn Address")[0].value=t_url;
        }
        else
        {
            console.log("Google 2 no exist");
            document.getElementsByName("LinkedIn Address")[0].value="Does not exist";
            document.getElementsByName("LinkedIn Address")[0].type="text";
            GM_setValue("returnHit",true);
            return;
        }
        var search_str=my_query.company_name+" "+ my_query.streetadd;//+" address";;//+my_query.streetadd;//


        var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);//+"?ei=tuC2Wu9awZ3nApPrpOgB";
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";//+"?ei=tuC2Wu9awZ3nApPrpOgB";

        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,

            onload: function(response) {
                console.log("Beginning Bing3\nURI="+search_URIBing);
                bing3_response(response, my_query);
                //google2_5_response(response, my_query);
            }

        });
        
    }

        /* Do phone and address */
    function google2_5_response(response,my_query) {

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
                    if(parseAddressStuff(field_names[i].nextSibling.innerText))
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
            var search_str=my_query.company_name+" address";

            var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);//+"?ei=tuC2Wu9awZ3nApPrpOgB";
           // var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str);//+"?ei=tuC2Wu9awZ3nApPrpOgB";

            GM_xmlhttpRequest({
                method: 'GET',
                url:    search_URI,

                onload: function(response) {
                    console.log("Beginning Google3\nURI="+search_URI);
                     google3_response(response, my_query);
                               }

            });
        }

    }

    function bing2_response(response,my_query) {
        //console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        var search=doc.getElementById("b_content");
        var search_str, search_URI;
        var b_algo=search.getElementsByClassName("b_algo");
        var i, b1_success=false, b_url="", b_header_search;
        console.log("bing2-b_algo.length="+b_algo.length);
        for(i=0; i < b_algo.length; i++)
        {

            b_url=b_algo[i].getElementsByTagName("cite")[0].innerText; // url of query
            b_header_search=b_algo[i].firstChild.innerText; // basic description
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
        }
        else
        {
            document.getElementsByName("LinkedIn Address")[0].value="Does not exist";
            document.getElementsByName("LinkedIn Address")[0].type="text";
            search_str=my_query.company_name+" "+my_query.fname+" "+my_query.lname+" Linkedin";
            search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);
            console.log("search_URI="+search_URI);
            GM_xmlhttpRequest({
                method: 'GET',
                url:    search_URI,

                onload: function(response) {

                    google2_response(response, my_query); return; }

            });
            return;
        }
        search_str=my_query.company_name+" "+ my_query.streetadd;//+" address";;//+my_query.streetadd;//


        search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);//+"?ei=tuC2Wu9awZ3nApPrpOgB";
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";//+"?ei=tuC2Wu9awZ3nApPrpOgB";

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
                    if(parseAddressStuff(field_names[i].nextSibling.innerText))
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
            var search_str=my_query.company_name+" " + my_query.streetadd+" site:yellowpages.com";

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
                     if(parseAddressStuff(field_names[i].nextSibling.nextSibling.innerText))
                        added_stuff+=1;
                    
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
            check_and_submit();
            return;
        }
        field_names=doc.getElementById("lgb_info");
        if(field_names!==null)
        {
            try
            {
                field_names=field_names.getElementsByClassName("b_factrow");
                 if(parseAddressStuff(field_names[1].innerText))
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
            check_and_submit();
            return;
        }
        else {


            var web_url=document.getElementsByName("web_url")[0];
            web_url.nextSibling.nextSibling.nextSibling.nextSibling.innerHTML="Corporate Phone: FAIL1";
            var search_str=my_query.company_name+" address";

            var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);//+"?ei=tuC2Wu9awZ3nApPrpOgB";
            var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";//+"?ei=tuC2Wu9awZ3nApPrpOgB";

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
    /* To check yellowpages */
    function google4_response(response,my_query) {


        //console.log(response.responseText);
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        var search=doc.getElementById("search");
        var g_stuff=search.getElementsByClassName("g");
        var web_url;

        try
        {
            web_url=g_stuff[0].getElementsByTagName("cite")[0].innerHTML;
        }
        catch(error)
        {
            console.log(error);
            GM_setValue("returnHit",true);
        }

        GM_xmlhttpRequest({
            method: 'GET',
            url:    web_url,

            onload: function(response) {
                console.log("Beginning yellowpage\nURI="+web_url);
                yellowpage_response(response, my_query);

            }
        });

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
                     if(parseAddressStuff(field_names[i].nextSibling.nextSibling.innerText))
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
            check_and_submit();

        }
        else {


            var web_url=document.getElementsByName("web_url")[0];
            web_url.nextSibling.nextSibling.nextSibling.nextSibling.innerHTML="Corporate Phone: FAIL2";
            var search_str=my_query.company_name+" " + my_query.streetadd;

            var search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);//+"?ei=tuC2Wu9awZ3nApPrpOgB";

        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URI,

            onload: function(response) {
                console.log("Beginning Google3\nURI="+search_URI);
                google2_5_response(response, my_query);
                //bing3_response(response, my_query);
            }

        });

        }

    }

    function yellowpage_response(response, my_query)
    {
         var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        try
        {
            var address=doc.getElementsByClassName("address")[0].innerText;
            var phone=doc.getElementsByClassName("phone")[0].innerText;

            document.getElementsByName("Corporate Phone")[0].value=phone;
             if(parseAddressStuff(address))
                 check_and_submit();
            return;

        }
        catch(error)
        {
            console.log("ERROR in yellowpages, " + error);
            GM_setValue("returnHit",true);
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

        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
        console.log(search_URIBing);

        document.getElementsByName("City")[0].addEventListener("paste",paste_city);


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
            document.getElementsByName("LinkedIn Address")[0].type="text";
            document.getElementsByName("City")[0].value="";
            document.getElementsByName("State")[0].value="";
            document.getElementsByName("Zip/Postal Code")[0].value="";
            document.getElementsByName("Country")[0].value="";
            document.getElementsByName("Corporate Phone")[0].value="";
            init_JennaMasuda();
        }

    }
    else
    {
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