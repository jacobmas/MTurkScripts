// ==UserScript==
// @name         LuisQuintero
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
    var email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?]+(\.[^<>()\[\]\\.,;:：\s@"\?]+)*)|("[^\?]+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
    var my_query = {};
    var email_list=[];
    var bad_urls=["app.lead411.com/","discoverthem.com/","searchherenow.com/"];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];

    function check_and_submit()
    {

        console.log("Checking and submitting");
        setTimeout(function() { document.getElementById("submitButton").click(); }, 1000);

    }

    function domain_response(response,resolve,reject) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        console.log("in domain_response");
        var search;

        var b_algo;
     //   var g_stuff;
        var i;
       // var g1_success=false;
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
                  b_url.indexOf("bloomberg.com") !== -1 || b_url.indexOf("chambersandpartners.com") !== -1 ||
                b_url.indexOf("bestlawyers.com") !== -1) {
                b_url=b_algo[i].getElementsByTagName("a")[0].href; // url of query
                i++;
            }
            var new_url=b_url.replace(/^https?:\/\//,"").replace(/^www\./,"").replace(/\/.*$/,"");
            // Eliminate extra . parts
            if(new_url.length>3 && new_url.substr(new_url.length-3,1)==='.')
            {
                new_url=new_url.replace(/^.*\.([^\.]*\.[^\.]*\.[^\.]*)$/,"$1");
            }
            else
            {
                new_url=new_url.replace(/^.*\.([^\.]*\.[^\.]*)$/,"$1");
            }
            console.log("new_url="+new_url);
            if(new_url!==null && new_url.length>0) {
                resolve(new_url);
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
    function domain_search(resolve,reject) {
        var google_search_str=my_query.company;
        //if(my_query.country!=="United States" && my_query.country!=="United Kingdom") google_search_str=google_search_str+" "+my_query.country;
        console.log("Searching with bing for "+google_search_str);
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(google_search_str)+"&first=1&rdr=1";
        var domain_URL='https://www.google.com/search?q='+encodeURIComponent(google_search_str);//+" company");
        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             domain_response(response, resolve, reject);
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


            });
    }
    /* Following the finding the domain */
    function domain_promise_then(domain_name) {
        var search_str, search_URI, search_URIBing;
        var fname=my_query.fname, lname=my_query.lname;
        my_query.domain_name=domain_name;
        if(fname.length>=1 && lname.length>=1)
        {
            var to_paste_str="";
            email_list.push((fname+"@"+domain_name).toLowerCase());
            email_list.push((fname.substr(0,1)+lname+"@"+domain_name).toLowerCase());
            email_list.push((fname+"."+lname+"@"+domain_name).toLowerCase());
            to_paste_str=to_paste_str+"\"" + fname+"@"+domain_name+"\" OR \"" + fname.substr(0,1)+lname+"@"+domain_name+"\" OR \"";
            to_paste_str=to_paste_str+fname+"."+lname+"@"+domain_name+"\" OR \"";
            to_paste_str=to_paste_str+fname+"_"+lname+"@"+domain_name+"\"";
            console.log("Success! Paste str="+to_paste_str);

            GM_setClipboard(to_paste_str);

            const domainPromise2 = new Promise((resolve, reject) => {
                var search_str, search_URI, search_URIBing;
                search_str=my_query.fname+" "+my_query.lname + " "+my_query.company+" site:"+my_query.domain_name;
                // Put into one object/map thing
                console.log("Failed to find email, new search is "+search_str);


                search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);

                search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
                console.log(search_URI);

                console.log(search_URIBing);

                GM_setClipboard(search_URIBing);



                GM_xmlhttpRequest({
                    method: 'GET',
                    url:    search_URIBing,

                    onload: function(response) {

                        bing1_response(response, resolve, reject);
                    }

                });
            });
            domainPromise2.then(
                function(response)  {
                    console.log("Success in bing1, response="+response);
                    check_and_submit();
                })
                .catch(function(response) {
                console.log("Failure in bing1, response="+response);

                search_str=to_paste_str;
                search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);
                console.log("About to search with " + search_URI);
                setTimeout(function() {
                    console.log("Beginning search");
                    GM_xmlhttpRequest({
                    method: 'GET',
                    url:    search_URI,

                    onload: function(response) {
                        {
                            google1_response(response);
                        }

                    }

                }); }, 1500);
                //GM_setValue("returnHit",true);
                //return false;
            });

        }

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
                var found_email=find_email(response);
                var curr_email=document.getElementById("Email Address").value;
                if(found_email && good_email(curr_email))
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


    function bad_email(curr_email)
    {
        return curr_email.toLowerCase().indexOf(my_query.lname.toLowerCase())===-1 &&
                        curr_email.toLowerCase().indexOf(my_query.fname.toLowerCase()) === -1;
    }
    function good_email(to_check)
    {
        var ends_pic=/jpg$/;
        var loc_at=to_check.indexOf("@");
        return loc_at!==-1 && (to_check.indexOf(my_query.lname.toLowerCase()) !==-1  ||
                               to_check.indexOf(my_query.fname.toLowerCase()) !==-1 ||
                (loc_at>=2 && loc_at <=3 &&  to_check.indexOf(my_query.fname.toLowerCase()[0])==0&&
                 to_check.indexOf(my_query.lname.toLowerCase()[0]+"@") !==-1)
               )  && !ends_pic.test(to_check) &&
                        to_check.substring(0,4)!=="info";
    }
    function invalid_email(to_check)
    {
        var ends_pic=/(jpg)|(png)$/;
        var examplecom=/example\.com$/;
        return ends_pic.test(to_check) || (to_check.length>=5 && to_check.substring(0,4)==="info") ||
                   examplecom.test(to_check) || (to_check.length>=9 && to_check.substring(0,8)==="webmaster") ||
        (to_check.length>=7 && to_check.substring(0,7)==="office@");
    }

    function find_email(response) {

        //  check for  this kind of sendmail thing

        /* <a href="javascript:SendMail('blittle', 'btlaw.com');" onmouseover="javascript:self.status='blittle'+'@'+'btlaw.com';"
        onmouseout="javascript:self.status='';"><img src="/files/ImageControl/27d34d91-19bb-42a2-b3c8-5daa7950b6b6/7483b893-e478-44a4-8fed-f49aa917d8cf/Presentation/Image/email.gif" border="0" imageon="/files/ImageControl/36497ae1-a3dc-4f6b-8a65-5f807190802a/7483b893-e478-44a4-8fed-f49aa917d8cf/Presentation/Image/email_over.gif" imageoff="/files/ImageControl/27d34d91-19bb-42a2-b3c8-5daa7950b6b6/7483b893-e478-44a4-8fed-f49aa917d8cf/Presentation/Image/email.gif" imagewayoff="/files/ImageControl/27d34d91-19bb-42a2-b3c8-5daa7950b6b6/7483b893-e478-44a4-8fed-f49aa917d8cf/Presentation/Image/email.gif"
        // onmouseover="javascript:this.src = this.getAttribute('imageOn');" onmouseout="javascript:this.src = this.getAttribute('imageOff');"></a> */
        //console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var i;
        var contact_href;
        var curr_email=document.getElementById("Email Address").value;
        var the_content;
       // console.log(doc.body.innerHTML);
          var email_match;
        var ends_pic=/(jpg)|(png)$/;
        var examplecom=/example\.com$/;
        var find_sendmail=/ail\(\'([^\']+)\',\s?\'([^\']+)\'\)/;
        var find_mailto=/^mailto:(.*)/;
        var match_mail;
         var links = doc.getElementsByTagName("a");

        for(i=0; i < links.length; i++)
        {
            //console.log("i="+i+", "+links[i]);
            match_mail=links[i].href.match(find_sendmail);
            if(match_mail!==null && match_mail.length>=3)
            {
                document.getElementById("Email Address").value=match_mail[1]+"@"+match_mail[2];
                //alert("Found sendmail");

            
            }
            match_mail=links[i].href.match(find_mailto);
            if(match_mail!==null && match_mail.length>=2)
            {
                document.getElementById("Email Address").value=match_mail[1];
                //alert("Found sendmail");

            }
            else if(links[i].dataset.email!==undefined)
            {
                document.getElementById("Email Address").value=links[i].dataset.email+"@"+links[i].dataset.emaildom;
                //return true;
            }
            if(links[i].dataset.name!==undefined)
            {
                document.getElementById("Email Address").value=links[i].dataset.name+"@"+links[i].dataset.suffix;
                return true;
            }


            email_match=links[i].textContent.match(email_re);
            if(email_match!==null && email_match.length>0)
            {
                console.log("email_match[0]="+email_match[0]);
                if(curr_email==="" && !invalid_email(email_match[0].toLowerCase()))
                    curr_email=email_match[0];
                else if(bad_email(curr_email.toLowerCase()) && !invalid_email(email_match[0].toLowerCase()) && good_email(email_match[0].toLowerCase())

                        )
                {
                    curr_email=email_match[0];
                }


                //check_and_submit();
                //return;
            }
            if(good_email(document.getElementById("Email Address").value))                return true;
        }
        if(curr_email!=="") {
                document.getElementById("Email Address").value=curr_email;
                return true;
            }
      
        email_match=doc.body.innerHTML.match(email_re);
        console.log("IN find emails");
        if(email_match!==null && email_match.length>0)
        {
            console.log("Matching emails");
            for(i=0; i < email_match.length; i++)
            {
                console.log("i="+i+", email="+email_match[i]);
                if(curr_email==="" && !invalid_email(email_match[i].toLowerCase()))
                    curr_email=email_match[i];
                else if(bad_email(curr_email.toLowerCase()) && !invalid_email(email_match[i].toLowerCase()) &&
                         good_email(email_match[i].toLowerCase())

                        )
                {
                    curr_email=email_match[i];
                }
            }
            if(curr_email!=="") {
                document.getElementById("Email Address").value=curr_email;
                return true;
            }
            //check_and_submit();
            //return;
        }
       
        //console.log(doc.body.innerHTML);
        return false;
    }

    function google1_response(response) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var bkWMgd;
        var search=doc.getElementById("search");
        if(search===undefined)
        {
            console.log("Google wall");
            GM_setValue("returnHit",true);
            return false;
        }

        try
        {
            bkWMgd=search.getElementsByClassName("bkWMgd");
        }
        catch(error)
        {
            console.log("Google wall");
            GM_setValue("returnHit",true);
            return false;
        }

        var g_stuff;
        var i,j;
        var g1_success=false;
        var s_stuff;
        var good_email;
        var t_url="", t_header_search="";
        if(bkWMgd!==undefined && bkWMgd.length>0)
        {
            g_stuff=bkWMgd[0].getElementsByClassName("g");
            for(i=0; i < g_stuff.length; i++)
            {
                try
                {
                    s_stuff=g_stuff[i].getElementsByClassName("s")[0].innerText;
                    //console.log("Past s_stuff");
                    t_url=g_stuff[i].getElementsByTagName("a")[0].href;
                    for(j=0; j < email_list.length; j++)
                    {
                        if(!bad_email_url(t_url) && s_stuff.toLowerCase().indexOf(email_list[j])!==-1)
                        {
                            g1_success=true;
                            good_email=email_list[j];
                            break;
                        }
                    }

                }
                catch(error)
                {
                    console.log("ERROR "+error);
                    GM_setValue("returnHit",true);
                    return false;

                }

                //console.log(temp1);
            }
        }
        if(g1_success)
        {
            document.getElementById("Email Address").value=good_email;
            console.log("Email Found!");
            check_and_submit();
            return true;
        }
        else
        {
            console.log("Google search for email exactness failed");
            GM_setValue("returnHit",true);
          /*  const domainPromise2 = new Promise((resolve, reject) => {
                var search_str, search_URI, search_URIBing;
                search_str=my_query.fname+" "+my_query.lname + " "+my_query.company+" site:"+my_query.domain_name;
                // Put into one object/map thing
                console.log("Failed to find email, new search is "+search_str);


                search_URI='https://www.google.com/search?q='+encodeURIComponent(search_str);

                search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
                console.log(search_URI);

                console.log(search_URIBing);

                GM_setClipboard(search_URIBing);



                GM_xmlhttpRequest({
                    method: 'GET',
                    url:    search_URIBing,

                    onload: function(response) {

                        bing1_response(response, resolve, reject);
                    }

                });
            });
            domainPromise2.then(
                function(response)  {
                    console.log("Success in bing1, response="+response);
                    check_and_submit();
                })
            .catch(function(response) {
                console.log("Failure in bing1, response="+response);
                GM_setValue("returnHit",true);
                return false;
            });*/
        }
    }

    function bad_email_url(to_check)
    {
        let i;
        for(i=0; i < bad_urls.length; i++)
        {
            if(to_check.indexOf(bad_urls[i])!==-1) return true;
        }
        return false;
    }

    function init_Quintero()
    {
        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        my_query={fname: wT.rows[1].cells[0].innerText, lname: wT.rows[1].cells[1].innerText,company: wT.rows[1].cells[2].innerText,
                  city: wT.rows[1].cells[3].innerText, state: wT.rows[1].cells[4].innerText, country: wT.rows[1].cells[5].innerText};
        console.log("my_query="+my_query);

        var search_str, search_URI, search_URIBing;

        const domainPromise = new Promise((resolve, reject) => {
            console.log("Beginning domain search");
            domain_search(resolve, reject);
        });
        domainPromise.then(domain_promise_then
        )
        .catch(function(val) {
           console.log("Failed crunch " + val); });





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

            init_Quintero();
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

                    setTimeout(function() { btns_secondary[0].click(); }, 0);
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