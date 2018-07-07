// ==UserScript==
// @name         TaylorFodor
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

    var automate=false;
    var email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%]+(\.[^<>()\[\]\\.,;:：\s@"\?]+)*)|("[^\?]+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

    var phone_re=/[\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6}/im;
    var fax_re=/Fax[:]?[\s]?([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;


    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
    var my_query = {};
    var email_list=[];
    var sch_name="School District Name", sch_domain="Domain of school district";
    var bad_urls=["www.greatschools.org","www.schooldigger.com","www.zillow.com","www.areavibes.com","elementaryschools.org",
                 "www.localschooldirectory.com","www.facebook.com","publicschoolsk12.com","www.century21.com","www.realtor.com",
                 "high-schools.com","www.privateschoolreview.com","www.publicschoolreview.com","www.niche.com","www.schoolcalendars.org",
                 "hometownlocator.com","www.trulia.com","en.wikipedia.org","usnews.com","cde.ca.gov","redfin.com",".neighborhoodscout.com",
                 "yelp.com","apartments.com","moovitapp.com","trueschools.com","nces.ed.gov","findglocal.com","glassdoor.com",
                 "spellingcity.com","glassdoor.co.in","wetakesection8.com","ratemyteachers.com","k12guides.com","yellowpages.com","usa.com",
                 "publicschoolsreport.com","noodle.com","school-supply-list.com","superpages.com","insideschools.org","century21.com",
                 "schooltree.org","alumniclass.com"];
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
      
            if(automate) {
                setTimeout(function() { document.getElementById("submitButton").click(); }, 0); }
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
    function dist_response(response,resolve,reject) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        console.log("in dist_response");
//        for(var i in response) console.log("i="+i+", "+response[i]);
       console.log(response.finalUrl);
        var search;

        var b_algo;
     //   var g_stuff;
        var i;
       // var g1_success=false;
        var b_url="crunchbase.com", b_name;

        var b1_success=false, b_header_search;
        var name_split;
        try
        {
            search=doc.getElementById("b_content");

            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);
            if(b_algo.length===0)
            {
                do_NA();
                return;
            }
          //  console.log("search.innerHTML="+search.innerHTML);
            //search=doc.getElementById("search");
            //g_stuff=search.getElementsByClassName("g");
          //  var t_url="crunchbase.com", t_header_search="";
            i=0;
            var fax_match;
            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                name_split=b_name.split(/\s-\s/);
                if(i==b_algo.length-1 || (name_split[0].indexOf(",")===-1 && name_split[0].indexOf("List of")===-1 &&
              name_split[0].indexOf("Wikipedia:")===-1 && name_split[0].indexOf("Historic District")===-1) )
                {
                    b1_success=true;
                    break;
                }

            }
            if(b1_success)
            {
                resolve(JSON.stringify({url: b_url, name: b_name, error:false}));
            }

            else
            {
                reject=(JSON.stringify({error: true, errorText: "Failed to find any urls"}));
            }
        }
        catch(error)
        {

            console.log("Error "+error);
            reject(JSON.stringify({error: true, errorText: error}));
        }
    }

    function sports_response(response,resolve,reject) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        console.log("in domain_response");
//        for(var i in response) console.log("i="+i+", "+response[i]);
       console.log(response.finalUrl);
        var sidearm=doc.getElementsByClassName("sidearm-table");
        if(sidearm!==null && sidearm!==undefined && sidearm.length>0)
        {
            parse_sidearm(sidearm[0]);
        }
  
    }
    function parse_sidearm(sidearm)
    {
        console.log("In parse_sidearm");
        var cat=sidearm.getElementsByClassName("sidearm-staff-category");
        var i,j;
        var curr_pos=0;
        var next_elem;
        var curr_th;
        var curr_name="", curr_title="", curr_phone="", curr_email="";
        for(i=0; i < cat.length; i++)
        {
            console.log("cat[i].innerText="+cat[i].innerText.toLowerCase().trim());
            if(is_right_sport(cat[i].innerText.toLowerCase().trim()))
            {
                j=cat[i].rowIndex+1;
                console.log(sidearm.rows[j].className);
                while(sidearm.rows[j].className==="sidearm-staff-member")
                {
                    var k;
                    console.log("j="+j+", "+sidearm.rows[j].cells.length);
                    curr_th=sidearm.rows[j].getElementsByTagName("th")[0];
                    for(k=0; k < sidearm.rows[j].cells.length; k++)
                    {
                        console.log("for "+k+", "+sidearm.rows[j].cells[k].headers);
                        if(sidearm.rows[j].cells[k].headers.indexOf("col-fullname")!==-1)
                        {
                            curr_name=sidearm.rows[j].cells[k].innerText.trim();
                        }
                        else if(sidearm.rows[j].cells[k].headers.indexOf("col-staff_title")!==-1)
                        {
                            curr_title=sidearm.rows[j].cells[k].innerText.trim();
                        }
                        else if(sidearm.rows[j].cells[k].headers.indexOf("col-staff_email")!==-1)
                        {
                            curr_email=sidearm.rows[j].cells[k].innerText.trim();
                        }
                        else if(sidearm.rows[j].cells[k].headers.indexOf("col-staff_phone")!==-1)
                        {
                            curr_phone=sidearm.rows[j].cells[k].innerText.trim();
                        }
                    }
                    add_to_query(curr_name, curr_title, curr_email, curr_phone);
                    j++;
                }

            }
        }
        check_and_submit();
        return;
    }
    function add_to_query(name, title, email, phone)
    {
        console.log("Name="+name+", title="+title+", email="+email+", phone="+phone);
        my_query.curr_pos=my_query.curr_pos+1;
        var the_name=parse_name(name);
        if(my_query.curr_pos<=10)
        {
            document.getElementById("First Name (Coach #"+my_query.curr_pos+")").value=the_name.fname;
            document.getElementById("Last Name (Coach #"+my_query.curr_pos+")").value=the_name.lname;
            document.getElementById("Job Title (Coach #"+my_query.curr_pos+")").value=title;
            document.getElementById("Email Address (Coach #"+my_query.curr_pos+")").value=email;
            document.getElementById("Phone Number (Coach #"+my_query.curr_pos+")").value=phone;
        }
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
    function prefix_in_string(prefixes, to_check)
    {
        var j;
        for(j=0; j < prefixes.length; j++)
            if(to_check.indexOf(prefixes[j])===0) return true;
        return false;
    }
    function is_right_sport(sports_str)
    {
        //console.log("my_query.sport.toLowerCase()="+my_query.sport.toLowerCase()+",\n\tsports_str="+sports_str);
        if((my_query.short_sport.length>0 && my_query.short_sport.toLowerCase().indexOf(sports_str) !== -1) ||
           my_query.sport.toLowerCase().indexOf(sports_str)!==-1)
        {
            console.log("Good sport");
            return true;
        }
        return false;

    }


      function sports_search(resolve,reject) {
        var search_str="school district "+my_query.name+" "+my_query.city+" "+my_query.state+" -site:publicschoolsk12.com";
//        if(!first_try) google_search_str=google_search_str+" "+my_query.country;
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
          console.log("search_URIBing=\n"+search_URIBing);
        var domain_URL=my_query.url;
        GM_xmlhttpRequest({
            method: 'GET',
            url:    domain_URL,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             sports_response(response, resolve, reject);
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
    function sports_promise_then(to_parse) {

      
    }

    /* Try to find the school district name */
 
 
    function init_TaylorFodor()
    {
 //       var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        var well=document.getElementsByClassName("well");
        my_query={url: well[0].innerText, sport: well[1].innerText, short_sport: "", curr_pos: 0};
       /* if(my_query.company.length==0){
            my_query.company=my_query.fname+" "+my_query.lname+" lawyer";
        }*/
        if(my_query.sport==="Women's Volleyball")
        {
            my_query.short_sport="Volleyball";
        }
        if(my_query.sport==="Field Hockey")
        {
            my_query.sport="Women's Field Hockey";
            my_query.short_sport="Field Hockey";
        }

        console.log("my_query="+JSON.stringify(my_query));
      

        var search_str, search_URI, search_URIBing;

        const sportsPromise = new Promise((resolve, reject) => {
            console.log("Beginning dist search");
            sports_search(resolve, reject);
        });
        sportsPromise.then(sports_promise_then
        )
        .catch(function(val) {
           console.log("Failed dist " + val);   GM_setValue("returnHit",true); });





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

            init_TaylorFodor();
        }

    }
    else
    {
       // console.log("In LuisQuintero main");
        if(automate)
            setTimeout(function() { btns_secondary[0].click(); }, 15000);
        GM_setValue("returnHit",false);
       GM_addValueChangeListener("returnHit", function() {
                if(GM_getValue("returnHit")!==undefined && GM_getValue("returnHit")===true &&
                  btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Return"
                  )
                {
                    if(automate)
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