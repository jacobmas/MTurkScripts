// ==UserScript==
// @name         MilenaBerry
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://*.linkedin.com/*
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

    var country_map={};
    var metro_map={"Greater Los Angeles Area": {city: "Los Angeles", state: "CA", country:"US"},
                   "Greater Chicago Area": {city:"Chicago","state":"IL","coutnry":"US"},
                   "Greater Indianapolis Area": {city:"Indianapolis","state":"IN","coutnry":"US"},
                   "Greater Louisville Area": {city:"Louisville","state":"KY","coutnry":"US"},
                  "Greater Boston Area": {city: "Boston", state: "MA", country:"US"},
                  "Greater Philadelphia Area": {city: "Philadelphia", state: "PA", country:"US"},
                  "Greater Detroit Area": {city: "Detroit", state: "MI", country:"US"},
                  "Greater St. Louis Area": {city: "St. Louis", state: "MO", country:"US"},
                  "Greater Kansas City Area": {city: "Kansas City", state: "MO", country:"US"},
                   "Greater New York City Area": {city: "New York", state: "NY", country:"US"},
                  "Greater Nashville Area": {city: "Nashville", state: "TN", country:"US"},
                  "Greater Seattle Area": {city: "Seattle", state: "WA", country:"US"}};
    var postal_code_map={"AL":"Alabama","AK":"Alaska","AZ":"Arizona","AR":"Arkansas","CA":"California","CO":"Colorado","CT":"Connecticut",
                         "DE":"Delaware","DC":"District of Columbia","FL":"Florida", "GA": "Georgia", "HI":"Hawaii", "ID":"Idaho",
                         "IL":"Illinois","IN":"Indiana","IA":"Iowa","KS":"Kansas","KY":"Kentucky","LA":"Louisiana","ME":"Maine",
                         "MD":"Maryland","MA":"Massachusetts","MI":"Michigan","MN":"Minnesota","MS":"Mississippi","MO":"Missouri",
                         "MT":"Montana","NE":"Nebraska","NV":"Nevada","NH":"New Hampshire","NJ":"New Jersey","NM":"New Mexico","NY":"New York",
                         "NC":"North Carolina","ND":"North Dakota","OH":"Ohio","OK":"Oklahoma","OR":"Oregon","PA":"Pennsylvania","RI":"Rhode Island",
                         "SC":"South Carolina","SD":"South Dakota","TN":"Tennessee","TX":"Texas","UT":"Utah","VT":"Vermont","VA":"Virginia",
                         "WA":"Washington","WV":"West Virginia","WI":"Wisconsin","WY":"Wyoming"};
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
        console.log("in check");

        console.log("Checking and submitting");


        if(GM_getValue("automate"))
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 20000);
        }
    }	

    



    function init_country_map()
    {
        var countryId=document.getElementById("country");
        var i;
        for(i=0; i < countryId.options.length; i++)
        {
            country_map[countryId.options[i].innerText]=countryId.options[i].value;
        }
        console.log("country_map="+JSON.stringify(country_map));
    }

    function init_Query()
    {
        init_country_map();
        GM_setValue("country_map",country_map);
      // var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        my_query={name};
        var dontbreak=document.getElementsByClassName("dont-break-out")[0];
        var url=dontbreak.href;
        if(url.indexOf(",")!==-1) url=url.split(",")[0];
        my_query.url=url;
        console.log("url="+url);

        GM_setValue("result","");
        GM_addValueChangeListener("result",function()
                                  {
            var result=JSON.parse(GM_getValue("result"));
            var x;
            for(x in result)
            {
                console.log("result["+x+"]=result[x]");
                document.getElementById(x).value=result[x];
            }
            var control_re=/(\d+)\s*\+\s*(\d+)\s*/;
            var controlLabel=document.getElementById("control_number").parentNode.parentNode.cells[0].innerText;
            var control_match=controlLabel.match(control_re);
            if(control_match===null)
            {
                console.log("Fucked up control label "+controlLabel);
            }
            else
            {
                document.getElementById("control_number").value=parseInt(control_match[1])+parseInt(control_match[2]);
            }

            check_and_submit(check_function,automate);

        });
        GM_setValue("url",url);

       





    }

    function do_linkedin()
    {
        var i;
        var title, company_name, date_range, date_from, date_to;
        var result={};
                country_map=GM_getValue("country_map");

       // window.scrollTo(0,document.body.scrollHeight);
        try
        {
            console.log("Checkpoint 0");
            var toggle_button=document.getElementsByClassName("pv-top-card-section__summary-toggle-button");
            var skills_button=document.getElementsByClassName("pv-skills-section__additional-skills");
            if(toggle_button.length>0)
            {
                toggle_button[0].click();
            }
            if(skills_button.length>0) skills_button[0].click();
            console.log("Checkpoint 1");
            var name_sec=document.getElementsByClassName("pv-top-card-section__name")[0];
            var full_name=parse_name(name_sec.innerText);
console.log("Checkpoint 2");
            var headline_sec=document.getElementsByClassName("pv-top-card-section__headline")[0];
            var summary_sec=document.getElementsByClassName("pv-top-card-section__summary-text")[0];
            var location=document.getElementsByClassName("pv-top-card-section__location")[0];
console.log("Checkpoint 3");
            result.firstName=full_name.fname;
            result.lastName=full_name.lname;
            if(headline_sec!==undefined)
                result.headline=headline_sec.innerText;
            console.log("Checkpoint 3.1");
            if(summary_sec!==undefined)
                result.summary=summary_sec.innerText;
              console.log("Checkpoint 3.2");
            if(location!==undefined)
            {
                console.log("Checkpoint 3.3");
                if(location.innerText.split(",").length===2)
                {
                    result.city=location.innerText.split(",")[0].trim();
                    result.state=location.innerText.split(",")[1].trim();
                    result.state=result.state.replace(/ Area$/,"");
                    if(!(result.state in state_map) && !(result.state in postal_code_map))
                    {
                        if(result.state in country_map)
                        {
                            result.country=country_map[result.state];
                            result.state="";
                        }
                    }
                    else
                    {
                        result.country="US";
                    }
                }
                else if(location.innerText.split(",").length===1)
                {
                    if(/Greater .* Area/.test(location.innerText) && location.innerText in metro_map)
                    {
                        result.city=metro_map[location.innerText].city;
                        result.state=metro_map[location.innerText].state;
                        result.country=metro_map[location.innerText].country;
                    }
                    else if(location.innerText in country_map)
                    {
                        result.country=country_map[location.innerText];
                    }
                    else
                    {
                        alert("Failed to find country");
                        GM_setValue("returnHit",true);
                    }
                }


                console.log("Checkpoint 3.4");
            }

console.log("Checkpoint 4");
            var exp_section=document.getElementById("experience-section");
            var jobs=exp_section.getElementsByTagName("li");
            //ClassName("pv-profile-section__card-item");
            console.log("Checkpoint 5");
            for(i=0; i < 4 && i < jobs.length; i++)
            {
                console.log("jobs: i="+i);
                if(jobs[i].getElementsByTagName("h3").length>0)
                {
                    result["jobTitle"+(i+1)]=jobs[i].getElementsByTagName("h3")[0].innerText;
                }
                if(jobs[i].getElementsByClassName("pv-entity__secondary-title").length>0)
                {
                    result["jobCompany"+(i+1)]=jobs[i].getElementsByClassName("pv-entity__secondary-title")[0].innerText;
                }
                if(jobs[i].getElementsByClassName("pv-entity__date-range").length>0)
                {
                    date_range=jobs[i].getElementsByClassName("pv-entity__date-range")[0].getElementsByTagName("span")[1].innerText.split(" – ");
                    if(date_range[1].indexOf(" ")===-1)
                    {
                        if(date_range[1]==="Present")
                        {
                            result["jobCompany"+(i+1)+"ToMonth"]="Present";
                            result["jobCompany"+(i+1)+"ToYear"]="";
                        }
                        else if(/^\d+$/.test(date_range[1].trim()))
                        {
                            result["jobCompany"+(i+1)+"ToMonth"]="";
                            result["jobCompany"+(i+1)+"ToYear"]=date_range[1].trim();
                        }
                    }
                    else
                    {
                        console.log("Date1first");
                        result["jobCompany"+(i+1)+"ToMonth"]=date_range[1].split(" ")[0].trim();
                        result["jobCompany"+(i+1)+"ToYear"]=date_range[1].split(" ")[1].trim();
                        console.log("Date1last");

                    }
                    if(date_range[0].indexOf(" ")===-1)
                    {
                        if(date_range[0]==="Present")
                        {
                            result["jobCompany"+(i+1)+"FromMonth"]="Present";
                            result["jobCompany"+(i+1)+"FromYear"]="";
                        }
                        else if(/^\d+$/.test(date_range[0].trim()))
                        {

                            result["jobCompany"+(i+1)+"FromMonth"]="";
                            result["jobCompany"+(i+1)+"FromYear"]=date_range[0].trim();
                        }
                    }
                    else
                    {
                        console.log("Date0first");
                        result["jobCompany"+(i+1)+"FromMonth"]=date_range[0].split(" ")[0].trim();
                        result["jobCompany"+(i+1)+"FromYear"]=date_range[0].split(" ")[1].trim();
                        console.log("Date0last");
                    }
                }
                if(jobs[i].getElementsByClassName("pv-entity__description").length>0)
                {

                    result["jobCompany"+(i+1)+"Description"]=jobs[i].getElementsByClassName("pv-entity__description")[0].innerText;
                }


            }
                        console.log("Checkpoint 6");
            var ed_section=document.getElementById("education-section");
            if(ed_section!==null)
            {
                var schools=ed_section.getElementsByClassName("pv-profile-section__card-item");
                for(i=0; i < 2 && i < schools.length; i++)
                {
                    console.log("schools, i="+i);
                    if(schools[i].getElementsByClassName("pv-entity__school-name").length>0)
                    {
                        result["degreeSchool"+(i+1)]=schools[i].getElementsByClassName("pv-entity__school-name")[0].innerText;
                    }
                    var degreepart1, degreepart2="";

                    if(schools[i].getElementsByClassName("pv-entity__degree-name").length>0)
                    {
                        degreepart1=schools[i].getElementsByClassName("pv-entity__degree-name")[0].getElementsByClassName("pv-entity__comma-item")[0].innerText;
                        degreepart2=schools[i].getElementsByClassName("pv-entity__fos");
                        if(degreepart2.length>0) degreepart2 = degreepart2[0].getElementsByClassName("pv-entity__comma-item")[0].innerText; else degreepart2="";
                        result["degreeTitle"+(i+1)]=degreepart1;
                        if(degreepart2.length>0) result["degreeTitle"+(i+1)]=result["degreeTitle"+(i+1)]+", "+degreepart2;
                        console.log("Done entity degree name");
                    }
                    if(schools[i].getElementsByClassName("pv-entity__dates").length>0)
                    {
                        date_range=schools[i].getElementsByClassName("pv-entity__dates")[0].getElementsByTagName("span")[1].innerText.split(" – ");
                        if(date_range.length===1)
                        {
                            date_range.push(" ");
                            date_range[1]=date_range[0];
                            date_range[0]="";
                        }
                        if(date_range[1].indexOf(" ")===-1)
                        {
                            if(date_range[1]==="Present")
                            {
                                result["degree"+(i+1)+"ToMonth"]="Present";
                                result["degree"+(i+1)+"ToYear"]="";
                            }
                            else if(/^\d+$/.test(date_range[1].trim()))
                            {
                                result["degree"+(i+1)+"ToMonth"]="";
                                result["degree"+(i+1)+"ToYear"]=date_range[1].trim();
                            }
                        }
                        else
                        {
                            result["degree"+(i+1)+"ToMonth"]=date_range[1].split(" ")[0].trim();
                            result["degree"+(i+1)+"ToYear"]=date_range[1].split(" ")[1].trim();;
                        }
                        if(date_range[0].indexOf(" ")===-1)
                        {
                            if(date_range[0]==="Present")
                            {
                                result["degree"+(i+1)+"FromMonth"]="Present";
                                result["degree"+(i+1)+"FromYear"]="";
                            }
                            else if(/^\d+$/.test(date_range[0].trim()))
                            {
                                result["degree"+(i+1)+"FromMonth"]="";
                                result["degree"+(i+1)+"FromYear"]=date_range[0].trim();
                            }
                        }
                        else
                        {
                            result["degree"+(i+1)+"FromMonth"]=date_range[0].split(" ")[0].trim();
                            result["degree"+(i+1)+"FromYear"]=date_range[0].split(" ")[1].trim();;
                        }
                    }
                }
            }
              console.log("Checkpoint 7");
            var featured=document.getElementsByClassName("pv-skill-categories-section__top-skills");
            if(featured.length>0)
            {
                var skills1=featured[0].getElementsByClassName("pv-skill-category-entity__name");
                result.skills="";

                for(i=0; i < skills1.length && i < 6; i++)
                {
                    result.skills=result.skills+skills1[i].innerText;
                    if(i < 5 && i < skills1.length-1) result.skills=result.skills+",";
                }
            }
               console.log("Checkpoint 8");
            var expanded=document.getElementById("skill-categories-expanded");
            if(expanded!==null && expanded !==undefined)
            {
                var skills2=expanded.getElementsByClassName("pv-skill-category-entity__name");
                result.additionalSkills="";

                for(i=0; i < skills2.length; i++)
                {
                    result.additionalSkills=result.additionalSkills+skills2[i].innerText;
                    if( i < skills2.length-1) result.additionalSkills=result.additionalSkills+",";
                }
            }
            GM_setValue("result",JSON.stringify(result));

        }
        catch(error)
        {
            console.log("Failed linkedin "+error);
            //GM_setValue("returnHit",true);
            return;
        }
    }

    function do_scroll(i) { my_query.scrolls++;
                           console.log("Scrolling for i="+(my_query.scrolls*1./4.)*document.body.scrollHeight);
                           window.scrollTo(0,(my_query.scrolls*1./4.)*document.body.scrollHeight); }

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
    else if(window.location.href.indexOf("linkedin.com")!==-1)
    {
        my_query.scrolls=0;
        GM_setValue("url","");
        GM_addValueChangeListener("url", function() { window.location.href=GM_getValue("url"); });
        window.scrollTo(0,document.body.scrollHeight);
        setTimeout(function()
                   {
            var i;
            var height=document.body.scrollHeight/7;
            for(i=0; i < 4; i++)
            {

                setTimeout(do_scroll, 500*(1+i));
            }
                  setTimeout(do_linkedin,2000); }, 1000);
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
                }, 50000);
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