// ==UserScript==
// @name         Brecht
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://www.bloomberg.com/*
// @include https://www.manta.com/*
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
        my_query.checking=true;
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
            setTimeout(function() { document.getElementById("submitButton").click(); }, 500);
	}
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
            /*if(b_algo.length===0)
            {
                console.log("b_algo length=0");
                GM_setValue("returnHit",true);
                return;
            }*/
           
            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;


                if(!is_bad_url(b_url, bad_urls) && b_url.indexOf("/research/stocks/private/")!==-1 &&
                   b_name.toLowerCase().indexOf(my_query.short_name.toLowerCase())!==-1)
                {
                    console.log("No probs");
                    b1_success=true;
                    console.log("old b_url="+b_url);

                    b_url=b_url.replace(/\/[^\/.]+\.asp/,"/snapshot.asp");
                     console.log("new b_url="+b_url);

                    break;

                }
                
            }
	    if(b1_success)
	    {
            resolve(b_url);
            return;
	    }
           

        }
        catch(error)
        {
	    console.log("Error "+error);
	    reject(error);
            return;
            
            //reject(JSON.stringify({error: true, errorText: error}));
        }
        if(my_query.count===0)
        {
            console.log("Nothing found in bloomberg: trying again");
            my_query.count++;;
            var search_str=my_query.name+" site:bloomberg.com";
            query_search(search_str,resolve,reject,query_response);
            return;
        }
        else
        {
            reject("Nothing found");
            //        GM_setValue("returnHit",true);
            return;
        }

    }

     function linkedin_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
          var pres_re=/(President)|(CEO)|(Chief Executive Officer)/i;
        var bad_pres_re=/(Vice[\s\-]President)|(Market President)|(Regional President)/i;
        var result={"first-name":"","last-name":"",title:"","source-url":"", "success": false};
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow, b_caption;
        var b1_success=false, b_header_search;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);
            /*if(b_algo.length===0)
            {
                console.log("b_algo length=0");
                GM_setValue("returnHit",true);
                return;
            }*/

            for(i=0; i < b_algo.length && i < 3; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;

                var b_name_split=b_name.split(" - ");

                console.log("i="+i+", b_name="+b_name);
                if(!is_bad_url(b_url, bad_urls) && b_url.indexOf("/in/")!==-1 && b_name_split.length>=2 &&
                  pres_re.test(b_name_split[1]) && !bad_pres_re.test(b_name_split[1]))
                {
                    console.log("Linkedin success");
                    b1_success=true;
                    result["source-url"]=b_url;
                    var fullname=parse_name_appell(b_name_split[0]);
                    result["first-name"]=fullname.fname;
                    result["last-name"]=fullname.lname;
                    result["title"]=b_name_split[1].replace(/\([^\)]+\)/,"");
                    result.success=true;
                    
                    if(!my_query.submitted)
                    {
                        GM_setValue("submitted",true);
                        my_query.submitted=true;

                        add_to_sheet(result);
                        if(my_query.checking===undefined || my_query.checking===false)
                        {
                            check_and_submit(check_function,automate);
                        }
                    }
                    return;

                }

            }



        }
        catch(error)
        {
	    console.log("Error "+error);
	    reject(error);
            return;

            //reject(JSON.stringify({error: true, errorText: error}));
        }

         reject("Nothing found via Linkedin");
         //        GM_setValue("returnHit",true);
         return;


    }

    function manta_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
          var pres_re=/(President)|(CEO)|(Chief Executive Officer)/i;
        var bad_pres_re=/(Vice[\s\-]President)|(Market President)|(Regional President)/i;
        var result={"first-name":"","last-name":"",title:"","source-url":"", "success": false};
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow, b_caption;
        var b1_success=false, b_header_search;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);
            /*if(b_algo.length===0)
            {
                console.log("b_algo length=0");
                GM_setValue("returnHit",true);
                return;
            }*/

            for(i=0; i < b_algo.length && i < 3; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;

                var b_name_split=b_name.split(" - ");

                console.log("i="+i+", b_name="+b_name);
                b_name=b_name.replace(" & "," and ");
                if(b_name.toLowerCase().indexOf(my_query.short_name.toLowerCase())!==-1)
                {
                    console.log("Manta success");
                   resolve(b_url);
                    return;

                }

            }



        }
        catch(error)
        {
	    console.log("Error "+error);
	    reject(error);
            return;

            //reject(JSON.stringify({error: true, errorText: error}));
        }

         reject("Nothing found via Manta");
         //        GM_setValue("returnHit",true);
         return;


    }



    function query_search(search_str, resolve,reject,callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
        var domain_URL='https://www.google.com/search?q='+encodeURIComponent(search_str);//+" company");
        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             callback(response, resolve, reject);
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


            });
    }

    /* Following the finding the district stuff */
    function query_promise_then(url) {
        console.log("Found bloom_url="+url);
        GM_setValue("bloom_result","");
        GM_addValueChangeListener("bloom_result", function() {
            var x;

            var result=GM_getValue("bloom_result");
            console.log("result="+JSON.stringify(result));
           

            if(!my_query.submitted)
            {
                GM_setValue("submitted",true);

                my_query.submitted=true;
                                add_to_sheet(result);
                if(my_query.checking===undefined || my_query.checking===false)
                        {
                            check_and_submit(check_function,automate);
                        }
            }
        });

        GM_setValue("bloom_url",url);


    }

    function manta_promise_then(url) {
        GM_setValue("manta_url",url);
        GM_xmlhttpRequest({
            method: 'GET',
            url:    url,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
                parse_manta(response);
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


            });

    }

    function parse_manta(response)
    {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("Parsing manta");
        var i,j;
        var name="",title="";
        var pres_re=/(President)|(CEO)|(Chief Executive Officer)/i;
        var bad_pres_re=/(Vice[\s\-]President)|(Market President)|(Regional President)/i;
        var result={};
        var result2={"telephone":"","employee":[],"streetAddress":"","addressLocality":"","addressRegion":"","postalCode":"",
                   "foundingDate":"","isicV4":""};
        try
        {
            var contact=doc.getElementById("contact");

            var prop_fields=doc.querySelectorAll("[itemprop]");
            for(i=0; i < prop_fields.length; i++)
            {
                if(prop_fields[i].getAttribute('itemprop')==='employee')
                {
                    var new_emp={name:"", jobTitle:""};
                    var emp_name=prop_fields[i].querySelector("[itemprop='name']"), emp_title=prop_fields[i].querySelector("[itemprop='jobTitle']");
                    if(emp_name!==undefined && emp_name !==null && emp_title!==null && emp_title!==undefined)
                    {
                        new_emp.name=emp_name.innerText;
                        new_emp.jobTitle=emp_title.innerText;
                        result2.employee.push(new_emp);
                    }

                }
                else if(result2[prop_fields[i].getAttribute('itemprop')]!==undefined)
                    {
                        result2[prop_fields[i].getAttribute('itemprop')]=prop_fields[i].innerText;
                        console.log("prop_fields["+i+"].innerText="+prop_fields[i].innerText);
                    }
                    else
                    {
                        console.log("Manta:" +prop_fields[i].getAttribute('itemprop'));
                    }

            }
            if(contact!==null)
            {
                console.log("Found contact");
               
                for(i=0; i < result2.employee.length; i++)
                {
                    name="";
                    title="";
                    
                    if(pres_re.test(result2.employee[i].jobTitle) && !bad_pres_re.test(result2.employee[i].jobTitle))
                    {
                        result["source-url"]=response.finalUrl;
                        var fullname=parse_name_appell(result2.employee[i].name);
                        result["first-name"]=fullname.fname;
                        result["last-name"]=fullname.lname;
                        result["title"]=result2.employee[i].jobTitle;
                        result.success=true;
                        my_query.success=true;
                        console.log("Manta found "+JSON.stringify(result)+"\nresult2="+JSON.stringify(result2));
                        if(!my_query.submitted)
                        {
                            GM_setValue("submitted",true);
                            my_query.submitted=true;

                            add_to_sheet(result);
                            if(my_query.checking===undefined || my_query.checking===false)
                            {
                                check_and_submit(check_function,automate);
                            }
                        }
                        return;
                    }
                    

                }
            }
        }
        catch(error)
        {
            console.log("Manta error "+error);
        }
        console.log("Manta failed");
        my_query.doneManta=true;
        const linkedinPromise = new Promise((resolve, reject) => {
            var search_str="+\""+my_query.short_name+"\" "+my_query.name+" "+my_query.location+" (CEO OR President OR Chief Executive Officer) site:linkedin.com/in";
            console.log("Beginning linkedin search");
            query_search(search_str, resolve, reject,linkedin_response);
        });
        linkedinPromise.catch(function(val) { console.log("Failed linkedin"); });
    }



    function add_to_sheet(result)
    {
        var x;
        for(x in result)
            {
                if(x !== "success")
                {
                    document.getElementById(x).value=result[x];
                }

            }
    }

    function parse_name_appell(to_parse)
    {
        var appell_re=/(Mrs\.)|(Ms\.)|(Dr\.)|(Mr\.)/
        var i;
        to_parse=to_parse.replace(appell_re,"").trim();
        while(to_parse.split(" ").length>1 && / [A-Z]+$/.test(to_parse))
        {
            to_parse=to_parse.replace(/ [A-Z]+$/,"");
        }
        return parse_name(to_parse);
    }

    function do_bloomberg()
    {
        console.log("Doing bloomberg");
        var result={"first-name":"","last-name":"",title:"","source-url":"", "success": false};
        var i;
        var pres_re=/(President)|(CEO)|(Chief Executive Officer)/;
        var bad_pres_re=/(Vice[\s\-]President)|(Market President)|(Regional President)/i;
        var officerInner=document.getElementsByClassName("officerInner");
        for(i=0; i < officerInner.length; i++)
        {
            var inner_divs=officerInner[i].getElementsByTagName("div");
            if(pres_re.test(inner_divs[1].innerText) && !bad_pres_re.test(inner_divs[1].innerText))
            {
                result["source-url"]=window.location.href;
                var fullname=parse_name_appell(inner_divs[0].innerText);
                result["first-name"]=fullname.fname;
                result["last-name"]=fullname.lname;
                result["title"]=inner_divs[1].innerText;
                result.success=true;
                GM_setValue("bloom_result",result);
                return;
            }

        }
        //GM_setValue("result",result);
    }




    function init_Query()
    {

       var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        automate=GM_getValue("automate");
        GM_setValue("TOSVFail","");
        GM_addValueChangeListener("TOSVFail",function() { alert("TOSV Fail for "+GM_getValue("TOSVFail")); });
        GM_addValueChangeListener("automate", function() { automate=GM_getValue("automate"); });
        my_query={name: wT.rows[0].cells[1].innerText, location: wT.rows[1].cells[1].innerText, count:0, submitted: false,

                 doneManta: false, doneLinkedin: false, doneBloomberg: false};

        my_query.name=my_query.name.replace(/(.*) The$/,"The $1").replace(/NA$/,"");

        my_query.short_name=my_query.name.replace(/^The /i,"");
        my_query.short_name=my_query.short_name.replace(/ Of .*$/i,"");
        my_query.short_name=my_query.short_name.replace(/ And .*$/i,"");

        if(!/^Bank/i.test(my_query.short_name))
        {
            my_query.short_name=my_query.short_name.replace(/Bank.*$/i,"");
        }
        my_query.short_name=my_query.short_name.replace(/ Association$/i,"");

        console.log(my_query.name+"\nshort_name="+my_query.short_name);
        var search_str=my_query.name+" "+my_query.location+" site:bloomberg.com";

        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject,query_response);
        });
        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val);  });



        const mantaPromise = new Promise((resolve, reject) => {
            search_str="+\""+my_query.short_name+"\" "+my_query.name+" "+my_query.location+" site:manta.com";
            console.log("Beginning manta search");
            query_search(search_str, resolve, reject,manta_response);
        });
        mantaPromise.then(manta_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this mantaPromise " + val+", trying linkedin");
        const linkedinPromise = new Promise((resolve, reject) => {
            var search_str="+\""+my_query.short_name+"\" "+my_query.name+" "+my_query.location+" (CEO OR President OR Chief Executive Officer) site:linkedin.com/in";
            console.log("Beginning linkedin search");
            query_search(search_str, resolve, reject,linkedin_response);
        });
            return;

            linkedinPromise.catch(function(val) { console.log("Failed linkedin"); });



        });





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
    else if(window.location.href.indexOf("bloomberg.com")!==-1)
    {
        if(window.location.href.indexOf("tosv.html")!==-1)
        {

            setTimeout(function() {
                GM_setValue("automate",false);
                 GM_setValue("TOSVFail","Bloomberg");
                alert("TOSV page");
            },5000);



        }
        GM_setValue("bloom_url","");
        GM_addValueChangeListener("bloom_url", function() { var url=GM_getValue("bloom_url"); window.location.href=url; });
        do_bloomberg();
    }
    else if(window.location.href.indexOf("manta.com")!==-1)
    {
        console.log("Doing manta");
        if(document.getElementById("distilCaptchaForm")!==null)
        {
            GM_setValue("automate",false);
            GM_setValue("TOSVFail","manta");
                alert("TOSV page");
        }
        else
        {
            console.log(JSON.stringify(document.getElementById("recaptcha-anchor-label")));
            GM_setValue("automate",true);
        }
        if(window.location.href.indexOf("/undefined")!==-1) window.location.href="https://www.manta.com";
        GM_setValue("manta_url","");
        GM_addValueChangeListener("manta_url", function() { var url=GM_getValue("manta__url"); window.location.href=url; });
    }
    else
    {
	/* Should be MTurk itself */
       
        if(automate)
        {
            setTimeout(function() {  btns_secondary[0].click(); }, 10000); }
        GM_setValue("returnHit",false);
       GM_addValueChangeListener("returnHit", function() {
                if(GM_getValue("returnHit")!==undefined && GM_getValue("returnHit")===true &&
                  btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Return"
                  )
                {
                    var submitted=GM_getValue("submitted",false);
                    if(automate && !submitted) {
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