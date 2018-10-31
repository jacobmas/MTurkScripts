// ==UserScript==
// @name         Derrick
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Parse gigmasters yelp etc
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://www.yelp.com*
// @include https://www.facebook.com*
// @include https://www.gigmasters.com*
// @include https://www.manta.com*
// @include file://*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant        GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @connect crunchbase.com
// @connect yelp.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var automate=GM_getValue("automate",false);
    var email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%]+(\.[^<>()\[\]\\.,;:：\s@"\?]+)*)|("[^\?]+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

    var phone_re=/[\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6}/im;
    var fax_re=/Fax[:]?[\s]?([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;


    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
    var my_query = {};
    var email_list=[];
    var sch_name="School District Name", sch_domain="Domain of school district";
    var bad_urls=["gigsalad.com","opendi.us","tel:","mixcloud.com"];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;
    var term_map={"biz_name":"Company_Name","biz_first":"First_Name","biz_last":"Last_Name","biz_state":"State","biz_phone":"phoneNumber",
                  "biz_email":"email","biz_talent":"Talent"};
    var reverse_state_map={};

    function init_reverse_state_map()
    {
        var x;
        for(x in state_map)
        {
            reverse_state_map[state_map[x]]=x;
        }
      //  console.log("reverse_state_map="+JSON.stringify(reverse_state_map));
    }
    function check_function()
    {
        return true;
    }
    function check_and_submit(check_function)
    {
        console.log("in check");
        if(!check_function())
        {
            GM_setValue("returnHit",true);
            console.log("bad");
            return;
        }
        console.log("Checking and submitting");


        if(GM_getValue("automate"))
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 1500);
        }
    }
    function is_bad_name(b_name)
    {
        return false;
    }

    function is_bad_fb_name(b_name)
    {
        var temp_name=b_name.replace(/[\'’\.]+/g,"").toLowerCase().trim().replace(/^The\s/i,"");
        var temp_biz_name=my_query.biz_name.replace(/[\'’\.]/g,"").toLowerCase().replace(/^The\s/i,"").trim();
       console.log("temp_name="+temp_name+"\ttemp_biz_name="+temp_biz_name);
        if(/^DJ /.test(my_query.biz_name))
        {
           // console.log("matched DJ");
            var my_match=my_query.biz_name.match(/^DJ\s[^\s]+/);
            if(my_match!==null && b_name.toLowerCase().indexOf(my_match[0].toLowerCase())===-1) return true;
        }
        else if(temp_biz_name.indexOf(temp_name.split(" ")[0].trim())===-1 || temp_name.indexOf(temp_biz_name.split(" ")[0].trim())===-1
               || (temp_name.indexOf(" ")!==-1 && temp_name.indexOf(temp_biz_name.split(" ")[0].trim()+" ")===-1)
                || (temp_biz_name.indexOf(" ")!==-1 && temp_biz_name.indexOf(temp_name.split(" ")[0].trim()+" ")===-1)
               )
        {
         //   console.log("b_name="+b_name+" is bad");
            return true;
        }
        else
        {
            console.log("biz_name in name="+temp_name.indexOf(temp_biz_name.split(" ")[0].trim())+
                        "\tname in biz_name="+temp_biz_name.indexOf(temp_name.split(" ")[0].trim()));
        }
        return false;
    }

    function is_bad_buzz_name(b_name)
    {
        return is_bad_fb_name(b_name);

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
            if(b_algo.length===0)
            {
                console.log("b_algo length=0");
                GM_setValue("returnHit",true);
                return;
            }
           
            for(i=0; i < b_algo.length && i < 5; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
		b_caption=b_algo[i].getElementsByClassName("b_caption");
		if(b_caption.length>0) b_caption=b_caption[0].innerText;



                if(!is_bad_url(b_url, bad_urls) && !is_bad_name(b_name) && b_url.indexOf("facebook.com")===-1)
                {
                    b1_success=true;
		    break;

                }
                
            }
	    if(b1_success)
	    {
            resolve(b_url);
            return;
            /* Do shit */
	    }
           

        }
        catch(error)
        {
	    console.log("Error "+error);
	    reject(error);
            return;
            
            //reject(JSON.stringify({error: true, errorText: error}));
        }
        my_query.doneCompany=true;
        do_finish();
//	reject("Nothing found");
//        GM_setValue("returnHit",true);
        return;

    }

    function fb_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in fb_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow, b_caption;
        var b1_success=false, b_header_search;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);
            if(b_algo.length===0)
            {
                console.log("b_algo length=0");
                GM_setValue("returnHit",true);
                return;
            }

            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
		b_caption=b_algo[i].getElementsByClassName("b_caption");
		if(b_caption.length>0) b_caption=b_caption[0].innerText;



                if(!is_bad_fb_name(b_name) && !/\/events\//.test(b_url) && b_url.indexOf("www.facebook.com")!==-1)
                {
                    b1_success=true;
		    break;

                }

            }
	    if(b1_success)
	    {
		/* Do shit */
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
        my_query.doneFB=true;
        do_finish();
//        GM_setValue("returnHit",true);
        return;

    }

    function buzzfile_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in buzzfile_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow, b_caption;
        var b1_success=false, b_header_search;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);
            if(b_algo.length===0)
            {
                console.log("b_algo length=0");
                my_query.doneBuzz=true;
                do_finish();
                return;
            }

            for(i=0; i < b_algo.length && i < 5; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
		b_caption=b_algo[i].getElementsByClassName("b_caption");
		if(b_caption.length>0) b_caption=b_caption[0].innerText;



                if(!is_bad_buzz_name(b_name))
                {
                    b1_success=true;
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
      my_query.doneBuzz=true;
        do_finish();
	//reject("Nothing found");
//        GM_setValue("returnHit",true);
        return;

    }

    function manta_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("Manta: in manta_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow, b_caption;
        var b1_success=false, b_header_search;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);
            if(b_algo.length===0)
            {
                console.log("b_algo length=0");
                my_query.doneManta=true;
                do_finish();
                return;
            }

            for(i=0; i < b_algo.length && i < 5; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
		b_caption=b_algo[i].getElementsByClassName("b_caption");
		if(b_caption.length>0) b_caption=b_caption[0].innerText;



                if(!is_bad_fb_name(b_name))
                {
                    b1_success=true;
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
      my_query.doneManta=true;
        do_finish();
	//reject("Nothing found");


        return;

    }

    function add_to_sheet()
    {
        var x;
        for(x in my_query)
        {
            if(term_map[x]!==undefined)
            {
                document.getElementById(term_map[x]).value=my_query[x];
            }

        }
    }
    /* To check if we're done and submit */
    function do_finish()
    {
        console.log("MOO");
        if(/^([A-Za-z]+)[\'’]s/.test(my_query.biz_name) && my_query.biz_first.length===0)
        {
            my_query.biz_first=my_query.biz_name.match(/([A-Za-z]+)[\'’]s/)[1];
        }
        console.log("Choo");
        if(my_query.biz_phone!==undefined)
        {
            console.log("my_query.biz_phone="+my_query.biz_phone);
            //my_query.biz_phone=my_query.biz_phone.replace(/^[^:]+:/,"").trim();
        }
        console.log("Too");
        add_to_sheet();
        console.log("\n\n(company, FB, buzz, Gig, Manta)=("+my_query.doneCompany+","+my_query.doneFB+","+my_query.doneBuzz+
                    ","+my_query.doneGig+","+my_query.doneManta+")\n\n")
        if(my_query.doneCompany && my_query.doneFB && my_query.doneBuzz && my_query.doneGig && my_query.doneManta && !my_query.submitted)
        {
            my_query.submitted=true;
            check_and_submit(check_function,automate);

        }
    }
    function query_search(search_str, resolve,reject, callback) {
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
    function query_promise_then(result) {
        if(my_query.biz_url.length===0)
        {
            my_query.biz_url=result;
            GM_xmlhttpRequest({method: 'GET', url:    my_query.biz_url,
                               onload: function(response) { parse_company_page(response); },
                               onerror: function(response) { console.log("Fail at company page"); my_query.doneCompany=true; do_finish(); },
                               ontimeout: function(response) { console.log("Fail at company page"); my_query.doneCompany=true; do_finish(); }
                              });
        }

    }

    /* After FB url is found, send the url to FB, update upon value change */
    function fb_promise_then(url) {
         GM_setValue("fb_result","");
         GM_addValueChangeListener("fb_result",function() {
             var result=arguments[2];
             console.log("Did FB_result\nOfficial: "+result.official);
             console.log("my_query="+JSON.stringify(my_query));
             if(result.name.length>0)
             {
                 var fullname=parse_name(result.name);
                 my_query.biz_first=fullname.fname;
                 my_query.biz_last=fullname.lname;
             }
             if(!my_query.doneEmail && result.email.length>0)
             {
                 my_query.biz_email=result.email;
             }
             if(my_query.biz_phone.length===0 && result.phone.length>0)
             {
                 my_query.biz_phone=result.phone;
             }
             if(result.talent.length>0 && my_query.biz_talent==="N/A")
             {
                 my_query.biz_talent=result.talent;
             }
             if(result.website.length>0 && my_query.biz_url.length===0)
             {
                 console.log("my_query.biz_url="+my_query.biz_url);
                 my_query.biz_url=result.website;
                 console.log("biz_url="+my_query.biz_url);
                 //my_query.doneCompany=false;
                 my_query.doneFB=true;
                 do_finish();
                 GM_xmlhttpRequest({
                    method: 'GET',
                    url:    my_query.biz_url,
                    timeout: 8000,
                    onload: function(response) {
                        console.log("Parsing company");
                        //   console.log("On load in crunch_response");
                        //    crunch_response(response, resolve, reject);
                        parse_company_page(response);

                    },
                    onerror: function(response) { console.log("Fail at company page"); my_query.doneCompany=true; do_finish(); },
                    ontimeout: function(response) { console.log("Fail at company page"); my_query.doneCompany=true;  do_finish(); }
                });
             }
             else
             {
                 console.log("Setting doneFB=true");
                 my_query.doneFB=true;
                 do_finish();
             }

         });

         if(url.indexOf("https://www.facebook.com/pages/")!==-1)
         {
             url=url.replace(/https?:\/\/www\.facebook\.com\/pages\/([^\/]+)\/([\d]+)(\/)?(.*)$/,"https://www.facebook.com/pg/$1-$2/about/?ref=page_internal");
                          console.log("Pages found, new url="+url);

              GM_setValue("fb_url",url);
         }
         else if(url!=="")
         {
             console.log("url="+url);
             url=url.replace("https://m.facebook.com/","https://www.facebook.com/");
             url=url.replace(/https?:\/\/www\.facebook\.com\/([^\/]+)(\/)?(.*)$/,"https://www.facebook.com/pg/$1/about/?ref=page_internal");

             console.log("url="+url);
             GM_setValue("fb_url",url);
         }
         else
         {
             console.log("####url="+url+"\tsetting doneFB");
             my_query.doneFB=true;
             do_finish();
         }

    }

    function buzz_promise_then(url) {
         my_query.buzz_url=url;
         GM_xmlhttpRequest({
                    method: 'GET', url: my_query.buzz_url,
                    onload: function(response) {
                        parse_buzzfile_page(response);
                    },
                    onerror: function(response) { console.log("Fail at buzz page"); my_query.doneBuzz=true; do_finish(); },
                    ontimeout: function(response) { console.log("Fail at buzz page"); my_query.doneBuzz=true; do_finish(); }
                });
     }

    function manta_promise_then(url) {
         console.log("Manta: IN manta_promise_then "+url);
        GM_setValue("manta_url",url);
        GM_xmlhttpRequest({
            method: 'GET',
            url:    url,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
                parse_manta(response);
            },
            onerror: function(response) { console.log("Fail"); my_query.doneManta=true; do_finish(); },
            ontimeout: function(response) { console.log("Fail"); my_query.doneManta=true; do_finish(); }


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
                   "foundingDate":"","isicV4":"","naics":"","email":""};
        try
        {
            var contact=doc.getElementById("contact");

            var prop_fields=doc.querySelectorAll("[itemprop]");
            for(i=0; i < prop_fields.length; i++)
            {
                if(prop_fields[i].getAttribute('itemprop')==='employee')
                {
                    var new_emp={name:"", jobTitle:"",phone:"",email:""};
                    var emp_name=prop_fields[i].querySelector("[itemprop='name']"), emp_title=prop_fields[i].querySelector("[itemprop='jobTitle']");
                    var emp_email=prop_fields[i].querySelector("[itemprop='email']"), emp_phone=prop_fields[i].querySelector("[itemprop='telephone']")
                    if(emp_name!==undefined && emp_name !==null)
                    {
                        console.log("Name: "+emp_name.innerText);
                        new_emp.name=emp_name.innerText;
                    }
                    if(emp_title!==undefined && emp_title !==null) new_emp.jobTitle=emp_title.innerText;
                    if(emp_phone!==undefined && emp_phone !==null) new_emp.phone=emp_phone.innerText;
                    if(emp_email!==undefined && emp_email !==null) new_emp.email=emp_email.innerText;
                    if(emp_name!==undefined && emp_name!==null) result2.employee.push(new_emp);

                }
                else if(result2[prop_fields[i].getAttribute('itemprop')]!==undefined)
                    {
                        result2[prop_fields[i].getAttribute('itemprop')]=prop_fields[i].innerText;
                        //console.log("prop_fields["+i+"].innerText="+prop_fields[i].innerText);
                    }
                    else
                    {
                      //  console.log("Manta:" +prop_fields[i].getAttribute('itemprop'));
                    }

            }

        }
        catch(error)
        {
            console.log("Manta error "+error);
        }
        if(result2.employee.length>0)
        {
            console.log("Manta: Found at least 1 employee");
            var temp_first="",temp_last="",temp_email="";
            let fullname;
            for(i=0; i < result2.employee.length; i++)
            {
                fullname=parse_name(result2.employee[i].name.split(",")[0]);
                if(result2.employee[i].email.length>0)
                {
                    my_query.biz_first=fullname.fname;
                    my_query.biz_last=fullname.lname;
                    my_query.biz_email=result2.employee[i].email;
                    if(result2.employee[i].phone.length>0) my_query.biz_phone=result2.employee[i].phone;
                    my_query.doneEmail=true;
                    break;
                }
                else {
                    temp_first=fullname.fname;
                    temp_last=fullname.lname;
                }
            }
            if(temp_first.length>0) {
                my_query.biz_first=temp_first;
                my_query.biz_last=temp_last;
            }
        }
        else
        {
            if(result2.telephone.length>0 && my_query.biz_phone.length===0) my_query.biz_phone=result2.telephone;
            if(result2.email.length>0) my_query.biz_email=result2.email;
        }




        console.log("Finished manta");

        my_query.doneManta=true;
        do_finish();

    }

    function parse_buzzfile_page(response)
    {
         var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var employee=doc.querySelector("[itemprop='employee']");
        if(employee!==undefined && employee!==null)
        {
            console.log("*** Buzzfile: Employee="+employee.innerText);
            var fullname=parse_name(employee.innerText);
            my_query.biz_first=fullname.fname.trim();
             my_query.biz_last=fullname.lname.trim();
            console.log("my_query.biz_first="+my_query.biz_first);

        }
        my_query.doneBuzz=true;
        do_finish();
    }

    function is_complete()
    {
       var x;
        for(x in term_map)
        {
            console.log("at term"+x+": "+my_query[x]);
            if(my_query[x]===undefined || my_query[x].length===0) return false;
        }
        return true;
    }



    function parse_yelp_search()
    {
        var i,j;
        var index_re=/^(\d+)\.\s*(.*)$/;
        var index_match;
        var result={success:false,innerText:""};
        my_query=GM_getValue("my_query");
        var bizindex=document.getElementsByClassName("indexed-biz-name");
        var success=false;
        for(i=0; i < bizindex.length; i++)
        {
            //console.log("("+i+"),"+bizindex[i].innerText);
            index_match=bizindex[i].innerText.match(index_re);
            if(index_match!==null&&parseInt(index_match[1])===my_query.listing_num)
            {
                result.innerText=bizindex[i].innerText;
                console.log("index_match="+JSON.stringify(index_match));
                success=true;
                result.success=true;
                result.biz_name=index_match[2];
                result.yelp_page=bizindex[i].getElementsByTagName("a")[0].href;
                //GM_setValue("my_query",my_query);
                break;
            }
        }
        if(success)
        {
            console.log("Success");
            GM_setValue("yelp_search_result",result);
            window.location.href=result.yelp_page;
            
        }
        else
        {
            GM_setValue("returnHit",true);
            return;
        }
    }

    function parse_yelp_page()
    {
        var result={success:false,biz_phone:"",biz_url:""};
         my_query=GM_getValue("my_query");
        var i,j;
        var bizwebsite=document.getElementsByClassName("biz-website");
        var bizphone=document.getElementsByClassName("biz-phone");
        if(bizphone.length>0)
        {
            result.biz_phone=bizphone[0].innerText.trim();
        }
        if(bizwebsite.length>0)
        {
            result.success=true;

            var full_url=bizwebsite[0].getElementsByTagName("a")[0].href;

            var biz_url=decodeURIComponent(full_url.match(/url\=([^\&]+)\&/)[1]);
            console.log("url="+biz_url);
            result.biz_url=biz_url;
        }
      //  GM_setValue("my_query",my_query);
        GM_setValue("yelp_result",result);
    }

    function init_gigmasters(url,listing_num)
    {
        var i;
        var url_match=url.match(/^https:\/\/www\.gigmasters\.com\/search\/(.*)$/);
        var type_split=url.split("-");

        my_query={url:url,listing_num:listing_num,doneFB: false, doneCompany: false,submitted:false
                 , biz_talent:"N/A",doneBuzz:false,biz_phone:"",biz_email:"",listing_num:listing_num,biz_url:"",
                 biz_state:type_split[type_split.length-1].toUpperCase(),doneGig:false,doneEmail:false,doneManta:false,biz_first:"",
                 biz_last:"",biz_name:""};
        console.log("my_query="+JSON.stringify(my_query));
        GM_setValue("my_query",my_query);

        GM_setValue("gig_result","");
        GM_setValue("gig_talent_result","");
        GM_addValueChangeListener("gig_talent_result",function() {
            var result=arguments[2];
            console.log("Finished gig_talent_result");
            if(result.talent.length>0)
            {
                my_query.biz_talent=result.talent;

            }
            my_query.doneGig=true;
            do_finish();

        });
        GM_setValue("gig_url",url);
        GM_addValueChangeListener("gig_result",function() {
            var result=arguments[2];
            my_query.biz_name=result.name.replace(/\|.*$/,"").trim();
            add_to_sheet();
             var search_str=my_query.biz_name+" ("+reverse_state_map[my_query.biz_state]+") site:facebook.com";

            const fbPromise = new Promise((resolve, reject) => {
                console.log("Beginning company url search");
                query_search(search_str, resolve, reject, fb_response);
            });

            fbPromise.then(fb_promise_then)
                .catch(function(val) {
                console.log("Failed at this fbPromise " + val);
                my_query.doneFB=true;
                do_finish();
            });
            search_str=my_query.biz_name+" "+my_query.biz_state;
                const queryPromise = new Promise((resolve, reject) => {
                    console.log("Beginning company url search");
                    query_search(search_str, resolve, reject, query_response);
                });
                queryPromise.then(query_promise_then
                                 )
                    .catch(function(val) {
                    console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });

            search_str=my_query.biz_name+" ("+reverse_state_map[my_query.biz_state]+") site:buzzfile.com";
            const buzzPromise = new Promise((resolve, reject) => {
                console.log("Beginning buzzfile search");
                query_search(search_str, resolve, reject, buzzfile_response);
            });
            buzzPromise.then(buzz_promise_then)
                .catch(function(val) {
                console.log("Failed at this buzzPromise " + val);
                my_query.doneBuzz=true;
                do_finish();
            });
            search_str=my_query.biz_name+" ("+reverse_state_map[my_query.biz_state]+") site:manta.com";
            const mantaPromise = new Promise((resolve, reject) => {
                console.log("Beginning manta search");
                query_search(search_str, resolve, reject, manta_response);
            });
            mantaPromise.then(manta_promise_then)
                .catch(function(val) {
                console.log("Failed at this mantaPromise " + val);
                my_query.doneManta=true;
                do_finish();
            });
        });
    }

    function init_Query()
    {

        var state_re=/\+([A-Z]+)$/;
        var well=document.getElementsByClassName("well");
        var well0=well[0];
        var listing_re=/Listing Number:\s*(\d+)/;
        var listing_match=well[0].innerText.match(listing_re);
        var listing_num;
        init_reverse_state_map();
        if(listing_match===null)
        {
            console.log("Error in listing_match");
            GM_setValue("returnHit",true);
            return;
        }

        listing_num=parseInt(listing_match[1]);

        var wT,state_match;//=document.getElementById("workContent").getElementsByTagName("table")[0];
        var url=document.getElementsByClassName("dont-break-out")[0].href;
        console.log("url="+url);
        if(url.indexOf("yelp.com")===-1)
       {
           if(url.indexOf("gigmasters.com")===-1)
           {
               console.log("Not yelp or gigmasters");
               GM_setValue("returnHit",true);
           }
           else {

              init_gigmasters(url,listing_num);
                    //          GM_setValue("returnHit",true);

           }
           return;
       }
        var original_url=url;
        var desc_re=/find_desc=([^\&]+)\&/;
        var find_desc=decodeURIComponent(original_url.match(desc_re)[1]).replace(/\+/g," ");
        var find_loc=decodeURIComponent(original_url.match(/find_loc=(.*)$/)[1]).replace(/\+/g," ");
        console.log("find_desc="+find_desc);
       
        if(find_loc==="Houston, TX")
        {
            if(find_desc==="Photo booth" && find_loc==="Houston, TX")
            {
                listing_num=listing_num<274 ? listing_num : 274;
            }
        }
        else if(find_loc==="San Antonio TX" && find_desc==="Photo booth") listing_num=listing_num<142 ? listing_num : 142;


        console.log("listing_num="+listing_num);
        url=url+"&start="+(listing_num-1);

        my_query={url:url,listing_num:listing_num,doneFB: false, doneCompany: false,submitted:false
                 , biz_talent:"N/A",doneBuzz:false,biz_phone:"",biz_email:"",listing_num:listing_num
                 ,doneGig:true,doneEmail:false,doneManta:false,biz_url:"",biz_first:"",
                 biz_last:"",biz_name:""};
        my_query.find_loc=find_loc;
        my_query.find_desc=find_desc;
        state_match=original_url.match(state_re);
        if(state_match!==null)
        {
            my_query.biz_state=state_match[1];
            console.log("state="+state_match[1]);
        }
        GM_setValue("my_query",my_query);
        GM_addValueChangeListener("my_query",function() {
            my_query.listing_num=arguments[2].listing_num;
            console.log("New value of my_query="+JSON.stringify(my_query));

             });
        console.log("my_query.url="+my_query.url);
        var search_str;
        GM_setValue("yelp_result","");
        GM_setValue("yelp_search_result","");
        GM_addValueChangeListener("yelp_result",function() {
            var result=arguments[2];

            console.log("yelp result="+JSON.stringify(result));
            if(my_query.biz_phone.length===0) my_query.biz_phone=result.biz_phone;
            if(!result.success)
            {
                console.log("*** Not result.success");

                add_to_sheet();
               if(my_query.biz_url.length===0)
                {
                    // we didn't get a page url
                    search_str=my_query.biz_name+" "+my_query.biz_state;
                    const queryPromise = new Promise((resolve, reject) => {
                        console.log("Beginning company url search");
                        query_search(search_str, resolve, reject, query_response);
                    });
                    queryPromise.then(query_promise_then
                                     )
                        .catch(function(val) {
                        console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
                }
            }
            else
            {
                console.log("*** Yes result.success");
                //if(result.bizPhone!==undefined) my_query.bizPhone=result.bizPhone;
                my_query.biz_url=result.biz_url;
                add_to_sheet();
                GM_xmlhttpRequest({
                    method: 'GET',
                    url:    my_query.biz_url,
                    timeout: 8000,
                    onload: function(response) {
                        //   console.log("On load in crunch_response");
                        //    crunch_response(response, resolve, reject);
                        parse_company_page(response);
                    },
                    onerror: function(response) { console.log("Fail at company page"); my_query.doneCompany=true; do_finish(); },
                    ontimeout: function(response) { console.log("Fail at company page"); my_query.doneCompany=true;  do_finish(); }
                });
            }
            // Search facebook for company
        });

        GM_addValueChangeListener("yelp_search_result",function() {
            var result=arguments[2];
            if(!result.success) return;
             console.log("result.innerText="+result.innerText);
            my_query.biz_name=result.biz_name;
            my_query.yelp_page=result.yelp_page;
            console.log("yelp_page="+my_query.yelp_page);

            search_str=my_query.biz_name+" ("+reverse_state_map[my_query.biz_state]+") site:facebook.com";
            const fbPromise = new Promise((resolve, reject) => {
                console.log("Beginning company url search");
                query_search(search_str, resolve, reject, fb_response);
            });
            fbPromise.then(fb_promise_then)
                .catch(function(val) {
                console.log("Failed at this fbPromise " + val);
                my_query.doneFB=true;
                do_finish();
                });
            search_str=my_query.biz_name+" ("+reverse_state_map[my_query.biz_state]+") site:buzzfile.com";
            const buzzPromise = new Promise((resolve, reject) => {
                console.log("Beginning buzzfile search");
                query_search(search_str, resolve, reject, buzzfile_response);
            });
            buzzPromise.then(buzz_promise_then)
                .catch(function(val) {
                console.log("Failed at this buzzPromise " + val);
                my_query.doneBuzz=true;
                do_finish();
            });
            search_str=my_query.biz_name+" ("+reverse_state_map[my_query.biz_state]+") site:manta.com";
            const mantaPromise = new Promise((resolve, reject) => {
                console.log("Beginning manta search");
                query_search(search_str, resolve, reject, manta_response);
            });
            mantaPromise.then(manta_promise_then)
                .catch(function(val) {
                console.log("Failed at this mantaPromise " + val);
                my_query.doneManta=true;
                do_finish();
            });
        });
     
        GM_setValue("yelp_url",my_query.url);
       




    }

    function parse_company_page(response)
    {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var begin_url=response.finalUrl.replace(/(https?:\/\/[^\/]+).*$/,"$1");
        var i;
        var links=doc.links;
        var complete;
        var found_contact=false;
        complete=is_complete();
            console.log("complete="+complete);
        if(complete) { console.log("Complete"); my_query.doneCompany=true; do_finish(); return; }
        if(my_query.biz_email.length===0)
        {
            contact_response(response,false);
        }
        if(my_query.biz_email!==undefined && my_query.biz_email.length>0)
        {
            console.log("Email now after company="+my_query.biz_email);
            my_query.doneCompany=true;
            do_finish();
            return;
        }
        else
        {
           links=doc.links;
            /* Search for contacts page */
            var about_url="";
            var contact_url="";
            for(i=0; i < links.length; i++)
            {
                links[i].href=links[i].href.replace(/https?:\/\/s3\.amazonaws\.com\/mturk_bulk\/hits\/(?:[\d]+)/,begin_url)
                .replace(/https?:\/\/s3\.amazonaws\.com/,begin_url);
                console.log("links["+i+"]="+links[i]);
                if(/Contact/i.test(links[i].innerText))
                {
                    console.log("found contact at "+links[i].href+"\t"+links[i].innerText);
                    found_contact=true;
                    break;
                }
                if(/About/i.test(links[i].innerText))
                {
                    about_url=links[i].href;
                }

            }
            if(found_contact) contact_url=links[i].href;
            else if(about_url.length>0) { contact_url=about_url; found_contact=true; }
            console.log("contact_url="+contact_url+"\n\n");
            if(found_contact && my_query.biz_email.length===0)
            {
                var new_url=contact_url;//.replace(/(https?:\/\/[^\/]+)\/?/,begin_url);
                console.log("*** Checking company contact page *** "+new_url);

                GM_xmlhttpRequest({
                    method: 'GET',
                    url:    new_url,

                    onload: function(response) {
                        //   console.log("On load in crunch_response");
                        //    crunch_response(response, resolve, reject);
                        contact_response(response,true);
                        return;
                    },
                    onerror: function(response) { console.log("Fail at company contact page"); my_query.doneCompany=true; do_finish(); },
                    ontimeout: function(response) { console.log("Fail at company contact page"); my_query.doneCompany=true; do_finish(); }
                });
            }
            else
            {
                my_query.doneCompany=true;
                do_finish();
                return;
            }

            /* Check the contact page */
        }

    }

    function contact_response(response,is_contact) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var i,j;
        var email_val;
        var my_match;
        var foundInsta=false, foundFB=false;
        console.log("in contact response "+response.finalUrl);
        var short_name=response.finalUrl.replace(/https?:\/\/[^\/]+/,"");//.replace(/[\/]+/g,"");
        var links=doc.links;
        var email_matches=doc.body.innerText.match(email_re);
        if(email_matches!==null)
        {
            j=0;
            console.log("Found emailzzzz");
            for(j=0; j < email_matches.length; j++)
            {
                if(!is_bad_email(email_matches[j]) && email_matches[j].length>0 && email_matches[j].indexOf("(")===-1
                  && email_matches[j].indexOf("godaddy.com")===-1
                  ) {

                   my_query.email=email_matches[j];
                   
                   break;
                }
            }


            console.log("Found email hop="+my_query.email);
        }

        for(i=0; i < links.length; i++)
        {
            if(/^tel:/.test(links[i].href))
            {
                my_query.biz_phone=links[i].href.match(/^tel:[^\d]*(.*)$/)[1];
            }
            if(links[i].href.indexOf("amazonaws.com")===-1 && links[i].href.indexOf("mturkcontent.com")===-1)
            {
                console.log(short_name+": ("+i+")="+links[i].href); }
            if(links[i].href.indexOf("cdn-cgi/l/email")!==-1)
            {
                var encoded_match=links[i].href.match(/#(.*)$/);
                if(encoded_match===null)
                {
                    console.log("**** match=null *** "+JSON.stringify(links[i].dataset));
                    encoded_match=[links[i].dataset.cfemail,links[i].dataset.cfemail];
                }
                if(encoded_match!==null)
                {
                    email_val=cfDecodeEmail(encoded_match[1]);
                    console.log("DECODED "+email_val);
                    my_query.email=email_val.replace(/\?.*$/,"");
                    
                    my_query.doneEmail=true;
                }
            }
            if(email_re.test(links[i].href.replace(/^mailto:\s*/,"")))
            {
                email_val=links[i].href.replace(/^mailto:\s*/,"").match(email_re);
                console.log("Found emailBlop="+email_val);

                if(!my_query.doneEmail && email_val.length>0 && !is_bad_email(email_val[0]))
                {
                    console.log("set email");
                    my_query.email=email_val[0].replace(/^20/,"");
                    my_query.biz_email=my_query.email;
                  
                }

            }
            if(links[i].href.indexOf("javascript:location.href")!==-1)
            {
                my_match=links[i].href.match(/String\.fromCharCode\(([^\)]+)\)/);
                console.log("my_match="+JSON.stringify(my_match));
                var match_split=my_match[1].split(",");
                email_val="";
                for(j=0; j < match_split.length; j++)
                {
                    email_val=email_val+String.fromCharCode(match_split[j].trim());
                }
                //email_val=String.fromCharCode(my_match[1]);
                console.log("new email_val="+email_val);
                my_query.email=email_val;
                    
            }
            if(links[i].href.indexOf("javascript:DeCryptX(")!==-1)
            {
               my_match=links[i].href.match(/DeCryptX\(\'([^\)]+)\'\)/);
                console.log("my_match="+JSON.stringify(my_match));
                email_val=DecryptX(my_match[1]);
                console.log("new email_val="+email_val);
            }

                //='mailto:'+String.fromCharCode(

        }
        //add_and_submit();
        if(!my_query.doneEmail && my_query.biz_email.length===0&& (my_query.email!==undefined && my_query.email.length>0))
        {
            my_query.biz_email=my_query.email;
        }
        if(is_contact)
        {
            my_query.doneCompany=true;
            do_finish();
            return;
        }


    }



    function do_fb()
    {
        console.log("Doing FB");
        my_query=GM_getValue("my_query");
        var result={email:"",name:"",url:window.location.href,talent:"",phone:"",official:false,website:""};
        var i;
        var contactlinks=document.getElementsByClassName("_50f4");
        var namelinks=document.getElementsByClassName("_42ef");
        var moreinfo=document.getElementsByClassName("_3-8w");
        console.log("my_query.find_desc="+my_query.find_desc);
        var is_unofficial=document.getElementsByClassName("_jl_").length>0;
        if(is_unofficial)
        {
            console.log("Is unofficial!!!");
                    GM_setValue("fb_result",result);
            return;
        }
        console.log("*** Is official");
        result.official=true;
        for(i=0; i < moreinfo.length; i++)
        {

            console.log("moreinfo["+i+"].innerText="+moreinfo[i].innerText);
            console.log("previous="+moreinfo[i].previousElementSibling.innerText);

             if(/Henna(\/|$|\s)/i.test(moreinfo[i].innerText))
                {
                    result.talent=result.talent+"Henna,";
                }
            if(/face paint/i.test(moreinfo[i].innerText)) result.talent=result.talent+"Face Painting,";
            if(/tattoo/i.test(moreinfo[i].innerText)) result.talent=result.talent+"Temporary tattoo,";
             if(/water slide/i.test(moreinfo[i].innerText)) result.talent=result.talent+"Water Slides,"
            if(/(^| )moonwalk/i.test(moreinfo[i].innerText)) result.talent=result.talent+"Moonwalks,"
            if(/superhero|super hero/i.test(moreinfo[i].innerText)) result.talent=result.talent+"Superhero,";
            if(/wedding/i.test(moreinfo[i].innerText)) result.talent=result.talent+"Weddings,";
            if(/birthday/i.test(moreinfo[i].innerText)) result.talent=result.talent+"Birthday parties,";
            if(/showers/i.test(moreinfo[i].innerText)) result.talent=result.talent+"Showers,";
            if(/juggling/i.test(moreinfo[i].innerText)) result.talent=result.talent+"Juggling,";
            if(/balloon/i.test(moreinfo[i].innerText)) result.talent=result.talent+"Balloon animals,";
            if(/magic show/i.test(moreinfo[i].innerText)) result.talent=result.talent+"Magic Shows,";


        }
        for(i=0; i < contactlinks.length; i++)
        {
            console.log("contactlinks["+i+"].innerText="+contactlinks[i].innerText);
            if(email_re.test(contactlinks[i].innerText))
            {
                result.email=contactlinks[i].innerText.match(email_re);
                console.log("Found email="+result.email);
            }
            else if(/^Call\s*(.*)/.test(contactlinks[i].innerText))
            {
                result.phone=contactlinks[i].innerText.match(phone_re);
                console.log("Found phone="+result.phone);
            }
            else if(/^http/.test(contactlinks[i].innerText))
            {
                result.website=contactlinks[i].innerText;
                console.log("Found website="+result.website);
            }
            else
            {
                console.log("("+i+")="+contactlinks[i].innerText);
            }
        }
        for(i=0; i < namelinks.length && i < 1; i++)
        {
            result.name=namelinks[i].innerText;
        }
        console.log("Done FB");
        result.talent=result.talent.replace(/\,$/,"");
        console.log("result.talent="+result.talent);
        GM_setValue("fb_result",result);

    }

    function do_gigmasters()
    {
        var i,j,x;
        my_query.loadCount=0;
        document.getElementsByClassName("top")[0].click();
        var option=document.getElementsByClassName("option");
        var select=option[0].getElementsByClassName("form-control")[0];
        select.value="number:50";
        var evt = new Event("change", {"bubbles":true, "cancelable":false});
        select.dispatchEvent(evt);
        select.click();
        var button=document.getElementsByTagName("button")[0];
        //button.setAttribute("disabled","");
        setTimeout(function() { console.log("Clicking!");
                               button.click();
                               setTimeout(function() { do_gigmasters1(); }, 1000);


                              }, 500);
       /* setTimeout(function() {
            var y=unsafeWindow.angular.module("gmPublicApp", []);
            var z=unsafeWindow.angular.element();
            console.log("z.scope()="+z.scope());
            for(x in unsafeWindow)
            {

                console.log("unsafeWindow["+x+"]="+typeof(unsafeWindow[x]));


            }
          for(x in y)
            {
                console.log("y["+x+"]="+y[x]);
                if(typeof(y[x])==="object")
                {
                    console.log(JSON.stringify(y[x]));
                }
            }
            for(x in z)
            {
                console.log("z["+x+"]="+z[x]);
                if(typeof(z[x])==="object")
                {
                    console.log(JSON.stringify(z[x]));
                }
            }
        }, 500);*/
    }
    /* Find the right gigmaster */
    function do_gigmasters1()
    {
        var i,j;
        var result={success:false};
        var vendor_re=/VENDORS\s*(\d+)\s*-\s*(\d+)\s*of\s*(\d+)/i,vendor_match;
        var enum_re=/#\s*(\d+)/,enum_match;
        var loadmore=document.getElementsByClassName("loadmore")[0];
        var loadbutton=document.getElementsByClassName("load-more-btn");

        var p=loadmore.getElementsByTagName("p")[0];
        var search=document.getElementsByClassName("search-result");
        vendor_match=p.innerText.match(vendor_re);
        var name;
        var gig_url;

        if(vendor_match!==null &&

           (my_query.listing_num <= parseInt(vendor_match[2])) || (my_query.listing_num<=25))
        {
            console.log("Found good, "+my_query.listing_num+", "+vendor_match[2]);
            if(my_query.listing_num>parseInt(vendor_match[2])) my_query.listing_num=parseInt(vendor_match[2]);

        }
        else
        {
            if(loadbutton[0].parentNode.className!=="ng-hide" && my_query.loadCount<10)
            {
                my_query.loadCount++;
                loadbutton[0].click();
                setTimeout(do_gigmasters1,700);
                return;
            }
            else
            {
                console.log("loadbutton[0].parentNode.className="+loadbutton[0].parentNode.className+"\tloadCount="
                           +my_query.loadCount);
            }
            console.log("Found bad, "+my_query.listing_num+", "+vendor_match[2]);
            GM_setValue("returnHit",true);
            return;
        }


        /* Find the right search */
        for(i=0; i < search.length; i++)
        {
            enum_match=search[i].getElementsByClassName("enumerator")[0].innerText.match(enum_re);
            if((enum_match!==null && parseInt(enum_match[1])===my_query.listing_num)
              ||(i===my_query.listing_num-1)
              )
            {
                name=search[i].getElementsByClassName("name")[0];
                console.log("Found match");
                result={name:name.innerText.trim(),success:true};
                gig_url=name.getElementsByTagName("a")[0].href;
            }

        }
        GM_setValue("gig_result",result);
        if(gig_url!==undefined) window.location.href=gig_url;
    }

    function do_grabgigstuff()
    {
        console.log("Doing grab gig stuff");
        var result={talent:""};
        var content=document.getElementsByClassName("content");
        var i,j;
        var service;
        for(i=0; i < content.length; i++)
        {
            if(content[i].parentNode.parentNode.getAttribute("section-title")==="Services")
            {
                service=content[i].getElementsByClassName("service");
                console.log("Found services! length="+service.length);

                for(j=0; j < service.length; j++)
                {
                    result.talent=result.talent+service[j].innerText.trim();
                    if(j<service.length-1) result.talent=result.talent+",";
                }
            }
        }
        console.log("result.talent="+result.talent);
        GM_setValue("gig_talent_result",result);
        return;
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

    else if(window.location.href.indexOf("yelp.com")!==-1)
    {
        console.log("Doing yelp");
        GM_setValue("yelp_url","");
        GM_addValueChangeListener("yelp_url",function() {
            console.log("arguments="+JSON.stringify(arguments));
            window.location.href=arguments[2];
        });
        console.log("window.location.href="+window.location.href);
        if(window.location.href.indexOf("/search?")!==-1)
        {
            if(document.getElementsByClassName("no-results").length>=1)
            {
                console.log("NO results");
                let my_match=window.location.href.match(/\=(\d+)$/);
                if(parseInt(my_match[1])-40>40) my_query.listing_num=parseInt(my_match[1])-40;
                else { my_query.listing_num=parseInt(my_match[1])/2; }
                GM_setValue("my_query",my_query);


                window.location.href=window.location.href.replace(/(\d+)$/,my_query.listing_num-1);
            }
            parse_yelp_search();
        }
        else if(window.location.href.indexOf("/biz/")!==-1)
        {
            setTimeout(parse_yelp_page,200);
        }
    }
    else if(window.location.href.indexOf("facebook.com")!==-1)
    {
        console.log("Running facebook");
        GM_setValue("fb_url","");
        if(window.location.href.indexOf("/?rf=")!==-1)
        {
            window.location.href=window.location.href.replace(/\/\?rf\=[\d]+/,"/about/?ref=page_internal");
        }
        GM_addValueChangeListener("fb_url", function() {

            var url=GM_getValue("fb_url","");
            console.log("url="+url);
            GM_setValue("new_FB",true);
            window.location.href=url; });
        setTimeout(do_fb, 2000);

    }
    else if(window.location.href.indexOf("gigmasters.com")!==-1)
    {
        console.log("Running gigmasters");
        my_query=GM_getValue("my_query");
        GM_setValue("gig_url","");

        GM_addValueChangeListener("gig_url", function() {
            window.location.href=arguments[2]; });
        if(window.location.href.indexOf("/search/")!==-1)
        {
            setTimeout(do_gigmasters, 500);
        }
        else if(/https?:\/\/www\.gigmasters\.com\/.+/.test(window.location.href))
        {
            setTimeout(do_grabgigstuff, 500);
        }

    }
    else if(window.location.href.indexOf("manta.com")!==-1)
    {
        console.log("Doing manta");
        if(document.getElementById("distilCaptchaForm")!==null)
        {
         //   GM_setValue("automate",false);
            GM_setValue("TOSVFail","manta");
                alert("TOSV page");
        }
        else
        {
            console.log(JSON.stringify(document.getElementById("recaptcha-anchor-label")));
          //  GM_setValue("automate",true);
        }
        if(window.location.href.indexOf("/undefined")!==-1) window.location.href="https://www.manta.com";
        GM_setValue("manta_url","");
        GM_addValueChangeListener("manta_url", function() { console.log("Manta url"); var url=GM_getValue("manta_url"); window.location.href=url; });

    }
    else if(window.location.href.indexOf("mturk.com")!==-1)
    {

	/* Should be MTurk itself */
        var globalCSS = GM_getResourceText("globalCSS");
        GM_addStyle(".btn-ternary { border: 1px solid #FA7070; background-color: #FA7070; color: #111111; }");
       var pipeline=document.getElementsByClassName("work-pipeline-action")[0];
        if(GM_getValue("automate")===undefined) GM_setValue("automate",false);

        var btn_span=document.createElement("span");
        var btn_automate=document.createElement("button");

         var btns_primary=document.getElementsByClassName("btn-primary");
        var btns_secondary=document.getElementsByClassName("btn-secondary");
         var my_secondary_parent=pipeline.getElementsByClassName("btn-secondary")[0].parentNode;
        btn_automate.className="btn btn-ternary m-r-sm";
        btn_automate.innerHTML="Automate";
        btn_span.appendChild(btn_automate);
        pipeline.insertBefore(btn_span, my_secondary_parent);
         GM_addStyle(globalCSS);
        if(GM_getValue("automate"))
        {
            btn_automate.innerHTML="Stop";
            /* Return automatically if still automating */
            setTimeout(function() {

                if(GM_getValue("automate")) btns_secondary[0].click();
                }, 45000);
        }
        btn_automate.addEventListener("click", function(e) {
            var auto=GM_getValue("automate");
            if(!auto) btn_automate.innerHTML="Stop";
            else btn_automate.innerHTML="Automate";
            GM_setValue("automate",!auto);
        });
        GM_setValue("returnHit",false);
        GM_addValueChangeListener("returnHit", function() {
            if(GM_getValue("returnHit")!==undefined && GM_getValue("returnHit")===true &&
               btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Return"
              )
            {
                if(GM_getValue("automate")) {
                    setTimeout(function() { btns_secondary[0].click(); }, 0); }
            }
        });
        /* Regular window at mturk */

       
        if(GM_getValue("stop") !== undefined && GM_getValue("stop") === true)
        {
        }
        else if(btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Skip" &&
                btns_primary!==undefined && btns_primary.length>0 && btns_primary[0].innerText==="Accept")
        {

            /* Accept the HIT */
            if(GM_getValue("automate")) {
                btns_primary[0].click(); }
        }
        else
        {
            /* Wait to return the hit */
            var cboxdiv=document.getElementsByClassName("checkbox");
            var cbox=cboxdiv[0].firstChild.firstChild;
            if(cbox.checked===false) cbox.click();
        }

    }


})();