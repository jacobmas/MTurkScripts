// ==UserScript==
// @name         Bruno Germansderfer
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Parse Yelp stuff for Bruno
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
// @include https://*.yelp.com/*
// @include https://*.facebook.com/*
// @include https://*.groupon.com/*
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
    var bad_urls=["yelp.com/user_details?","https://www.yelp.com/search?","www.yelp.com/biz_photos","www.yelp.com/map/"];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;

    function check_function()
    {
	return true;
    }
    function check_and_submit(check_function)
    {
         var day_list=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
        var i;
        for(i=0; i < day_list.length; i++)
            {
                 if(document.getElementById(day_list[i]+"-1-open").value.length===0 &&
                    document.getElementById(day_list[i]+"-1-close").value.length===0 && !document.getElementById(day_list[i]+"-closed").checked)
                     document.getElementById(day_list[i]+"-closed").checked=true;
            }
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
            setTimeout(function() { document.getElementById("submitButton").click(); }, 0);
        }
    }

    function is_bad_yelp(b_algo,i)
    {
        console.log("i="+i);
        console.log("b_algo.innerText="+b_algo.innerText);
        var b_caption;
        try
        {
            b_caption=b_algo.getElementsByClassName("b_caption")[0].innerText;
           /* if(b_caption.indexOf(my_query.address.split(" ")[0]+" ")===-1 )
            {
                console.log("Bad number");
                return true;
            }*/
        }
        catch(error)
        {
            return true;
        }
        return false;
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
                if(my_query.yelpCount===0 && response.finalUrl.indexOf("yelp.com")!==-1)
                {
                    my_query.yelpCount++;
                    query_search(my_query.address+" "+my_query.city+" "+my_query.state+" "+my_query.name.split(" ")[0]+" site:yelp.com", resolve, reject);
                }
                else
                {
                    console.log("Nothing found b_algo=0");
                    resolve("");
                    return;
                }
            }

            for(i=0; i < b_algo.length && i<4; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent.toLowerCase();
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption")[0].innerText;

                if(!is_bad_url(b_url,bad_urls))
                {
                    if(!(response.finalUrl.indexOf("yelp.com")!==-1 && is_bad_yelp(b_algo[i], i)))
                    {

                        console.log("B1 success with "+b_url);
                        b1_success=true;
                        break;
                    }

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
        if(my_query.yelpCount===0 && response.finalUrl.indexOf("yelp.com")!==-1)
        {
            my_query.yelpCount++;
            query_search(my_query.address+" "+my_query.city+" "+my_query.state+" "+my_query.name.split(" ")[0]+" site:yelp.com", resolve, reject);
            return;
        }
        else
        {
            console.log("Nothing found");
            resolve("");
            return;
        }

//        GM_setValue("returnHit",true);
        return;

    }

    function query_search(search_str, resolve,reject) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
        var domain_URL='https://www.google.com/search?q='+encodeURIComponent(search_str);//+" company");
        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             query_response(response, resolve, reject);
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


            });
    }

    /* Following the finding the district stuff */
    function yelp_promise_then(url) {
        GM_setValue("yelp_result","");
        var i;
        var is_empty=true;
        var day_list=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];


        GM_addValueChangeListener("yelp_result", function()
                                  {
            if(my_query.doneYelp)
            {
                console.log("Already did Yelp");
                return;
            }
            var result=JSON.parse(GM_getValue("yelp_result"));
            console.log("yelp_result="+JSON.stringify(result));
            if(result.city.toLowerCase()!==my_query.city.toLowerCase() || result.state.toLowerCase() !== my_query.state.toLowerCase())
            {
                console.log("result.city="+result.city+", my_query.city="+my_query.city+"\nresult.state="+result.state+", my_query.state="+my_query.state);
                console.log("NO match, return");

            }
            else
            {

                for(i=0; i < day_list.length; i++)
                {
                    if(result.openTime[i].length>0 || result.closeTime[i].length>0 || result.closed[i]) is_empty=false;

                    if(document.getElementById(day_list[i]+"-1-open").value.length===0)
                    {
                        document.getElementById(day_list[i]+"-1-open").value=result.openTime[i].toUpperCase().trim();
                    }
                    if(document.getElementById(day_list[i]+"-1-close").value.length===0)
                    {
                        document.getElementById(day_list[i]+"-1-close").value=result.closeTime[i].toUpperCase().trim();
                    }
                    if(!document.getElementById(day_list[i]+"-closed").checked)
                    {
                        document.getElementById(day_list[i]+"-closed").checked=result.closed[i];
                    }
                }
            }

            console.log("Done yelp!, doneFB="+my_query.doneFB);
            //if(!(is_empty && document.getElementById("categories").value.length===0 && document.getElementById("bizinfo").value.length===0))
            my_query.doneYelp=true;

           do_finish();


        });
        console.log("url="+url);
        if(url!=="")
        {
            GM_setValue("url",url);
        }
        else
        {
            my_query.doneYelp=true;
            do_finish();
        }

    }
    function do_finish()
    {
        console.log("Doing finish");
         if(my_query.doneYelp && my_query.doneFB && my_query.doneGroupon && !my_query.submitted)
            {
                my_query.submitted=true;

                check_and_submit(check_function,automate);
            }
    }

    function FB_promise_then(url) {
        GM_setValue("FB_result","");
        var i;
         var is_empty;
        var day_list=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
        GM_addValueChangeListener("FB_result", function()
                                  {
            is_empty=true;
            console.log("FB result change");
            var result=JSON.parse(GM_getValue("FB_result"));
            console.log("MOOO");
            console.log("FB_result="+JSON.stringify(result));
            if(!(result.failed))
            {

                for(i=0; i < day_list.length; i++)
                {
                    if(result.openTime[i].length>0 || result.closeTime[i].length>0 || result.closed[i]) is_empty=false;
                    console.log("value="+document.getElementById(day_list[i]+"-1-open").value);
                    if(document.getElementById(day_list[i]+"-1-open").value.length===0)
                    {
                        document.getElementById(day_list[i]+"-1-open").value=result.openTime[i].toUpperCase().trim();
                    }
                    if(document.getElementById(day_list[i]+"-1-close").value.length===0)
                    {
                        document.getElementById(day_list[i]+"-1-close").value=result.closeTime[i].toUpperCase().trim();
                    }

                    document.getElementById(day_list[i]+"-closed").checked=result.closed[i];

                }
            }
            console.log("Done FB!");
            my_query.doneFB=true;
            do_finish();

        });
        console.log("FB_url="+url);
         if(url.indexOf("https://www.facebook.com/pages/")!==-1)
         {
             url=url.replace(/https?:\/\/www\.facebook\.com\/pages\/([^\/]+)\/([\d]+)(\/)?(.*)$/,"https://www.facebook.com/pg/$1-$2/about/?ref=page_internal");
                          console.log("Pages found, new url="+url);

              GM_setValue("FB_url",url);
         }
         else if(url!=="")
         {
             console.log("url="+url);
             url=url.replace("https://m.facebook.com/","https://www.facebook.com/");
            url=url.replace(/https?:\/\/www\.facebook\.com\/([^\/]+)(\/)?(.*)$/,"https://www.facebook.com/pg/$1/about/?ref=page_internal");

               console.log("url="+url);
             GM_setValue("FB_url",url);
         }
        else
        {
            my_query.doneFB=true;
            do_finish();
        }

    }

    function groupon_promise_then(url) {
        GM_setValue("groupon_result","");
        var i;
         var is_empty;
        var day_list=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
        GM_addValueChangeListener("groupon_result", function()
                                {
            if(my_query.doneGroupon) return;
            is_empty=true;
            console.log("Groupon result change");
            var result=JSON.parse(GM_getValue("groupon_result"));
            console.log("MOOO");
            console.log("groupon_result="+JSON.stringify(result));
            if(!(result.failed))
            {

                for(i=0; i < day_list.length; i++)
                {
                    if(result.openTime[i].length>0 || result.closeTime[i].length>0 || result.closed[i]) is_empty=false;
                    console.log("value="+document.getElementById(day_list[i]+"-1-open").value);
                    if(document.getElementById(day_list[i]+"-1-open").value.length===0)
                    {
                        document.getElementById(day_list[i]+"-1-open").value=result.openTime[i].toUpperCase().trim();
                    }
                    if(document.getElementById(day_list[i]+"-1-close").value.length===0)
                    {
                        document.getElementById(day_list[i]+"-1-close").value=result.closeTime[i].toUpperCase().trim();
                    }

                    document.getElementById(day_list[i]+"-closed").checked=result.closed[i];

                }
            }
            console.log("Done groupon!");
            my_query.doneGroupon=true;
           do_finish();

        });
        console.log("groupon_url="+url);
        if(url!=="")
        {
            GM_setValue("groupon_url",url);
        }
        else
        {
            console.log("Setting doneGroupon=true");
            my_query.doneGroupon=true;
            do_finish();
        }

    }


    function do_yelp()
    {
        var i;
        var result={closed: [], openTime: [], closeTime: [],categories:"",bizinfo: "", city:"",state:""};
        var weekday, hours;
        var street_add=document.getElementsByClassName("map-box-address");
        var day_map={"Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6};
        var biz_header=document.getElementsByClassName("biz-page-header");
        var ywidget=document.getElementsByClassName("ywidget");
        var my_query=GM_getValue("my_query");
        console.log("my_query="+JSON.stringify(my_query));


        if(street_add.length>0)
        {

            var real_address=street_add[0].getElementsByTagName("address")[0].innerText;
            if(real_address.indexOf("\n")===-1) real_address="Fake Street\n"+real_address;
            real_address=real_address.replace(/\n/,",");
            real_address=real_address.replace(",Ft ",",Fort ").replace(" Bch "," Beach ").replace( "Ft "," Fort ");
//            console.lo
            console.log("street_add[0].innerText.toLowerCase()="+real_address.toLowerCase());
            var new_add=parseAddress.parseLocation(real_address);
            console.log("new_add="+JSON.stringify(new_add));
            result.city=new_add.city;
            result.state=new_add.state;
            if(street_add.length>0 &&
               (street_add[0].innerText.toLowerCase().indexOf(my_query.city.toLowerCase())===-1 ||
                street_add[0].innerText.toLowerCase().indexOf(my_query.state.toLowerCase())===-1 ||
                (new_add.number!==null && new_add.number!==undefined && my_query.address.toLowerCase().indexOf(new_add.number)===-1)

               )
              )

            {
                console.log("Failed, bad yelp");
                result.failed=true;
                GM_setValue("yelp_result",result);
                return;
            }
        }
        else
        {
            console.log("No street add found");
        }

         for(i=0; i < 7; i++)
        {
            result.closed.push(false);
            result.openTime.push("");
            result.closeTime.push("");
        }


        var hours_t=document.getElementsByClassName("hours-table");
        if(hours_t.length>0)
        {
            for(i=0; i < hours_t[0].rows.length; i++)
            {
                weekday=hours_t[0].rows[i].cells[0].innerText;
                hours=hours_t[0].rows[i].cells[1].innerText;
                if(hours.indexOf("Closed")!==-1)
                {
                    result.closed[day_map[weekday]]=true;
                }
                if(hours.indexOf("Open 24")!==-1)
                {
                    result.openTime[day_map[weekday]]="12:00 am";
                    result.closeTime[day_map[weekday]]="11:59 pm";
                }
                else if(hours.indexOf("-")!==-1)
                {
                    var the_spans=hours_t[0].rows[i].cells[1].getElementsByTagName("span");
                    result.openTime[day_map[weekday]]=fix_time(the_spans[0].innerText);
                    result.closeTime[day_map[weekday]]=fix_time(the_spans[1].innerText);
                }
                else
                {
                    console.log("Error parsing time");
                }
            }

        }
        else
        {
            console.log("Can't find hours table");
        }
        if(biz_header.length>0)
        {
            var cat_str=biz_header[0].getElementsByClassName("category-str-list");
            if(cat_str.length>0) result.categories=cat_str[0].innerText;
        }
        for(i=0; i < ywidget.length; i++)
        {
            var h3=ywidget[i].getElementsByTagName("h3");
            if(h3.length>0 && h3[0].innerText.indexOf("More business info")!==-1)
            {
                var ylist=ywidget[i].getElementsByClassName("ylist");
                if(ylist.length>0)
                {
                    result.bizinfo=ylist[0].innerText;
                }
            }
        }
        console.log("result="+JSON.stringify(result));
        GM_setValue("yelp_result",JSON.stringify(result));
    }

    function do_groupon()
    {
         console.log("Doing groupon");
         var result={closed: [], openTime: [], closeTime: [], failed:false, city:"", state:"",number:""};
        var daystimes=document.getElementsByClassName("merchant-hours");
        var day_map={"Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6};
         var my_query=GM_getValue("my_query");
         var i;
         for(i=0; i < 7; i++)
        {
            result.closed.push(false);
            result.openTime.push("");
            result.closeTime.push("");
        }

        var street_add;
        var fulladdress=document.getElementsByClassName("full-address");
        if(fulladdress.length>0)
        {
            var new_add=parseAddress.parseLocation(fulladdress[0].innerText);
            console.log("new_add="+JSON.stringify(new_add));
            result.city=new_add.city;
            result.state=new_add.state;
            if(
                (new_add.number!==null && new_add.number!==undefined && my_query.address.toLowerCase().indexOf(new_add.number)===-1)
                || (result.city.toLowerCase()!==my_query.city.toLowerCase()) || (
                    result.state.toLowerCase()!==my_query.state.toLowerCase())
               )


            {
                console.log("Failed, bad groupon address");
                result.failed=true;
                GM_setValue("groupon_result",result);
                return;
            }


        }
        if(daystimes.length===0)
        {
            console.log("Can't find merchant-hours");
            result.failed=true;
            GM_setValue("groupon_result",JSON.stringify(result));
            return;
        }


        console.log("daystimes[0].innerHTML="+daystimes[0].innerHTML);
        var hoursdayranges=daystimes[0].getElementsByClassName("hours-for-day-range");
        var curr_day, curr_hours;
        for(i=0; i < hoursdayranges.length; i++)
        {
            console.log("hoursdayranges["+i+"].innerText="+hoursdayranges[i].innerHTML);
            curr_day=hoursdayranges[i].getElementsByClassName("day-range")[0].innerText;
            curr_hours=hoursdayranges[i].getElementsByClassName("hours-range")[0].innerText;
            console.log("i="+i+", curr_day="+curr_day+", curr_hours="+curr_hours);
            var hours_split=curr_hours.split(",");
            curr_hours=hours_split[hours_split.length-1].trim();

            if(curr_day.indexOf("-")===-1)
            {
                if(curr_hours.toLowerCase().indexOf("closed")!==-1) result.closed[day_map[curr_day]]=true;
                else
                {
                    result.openTime[day_map[curr_day]]=fix_time(curr_hours.split(" - ")[0]);
                    result.closeTime[day_map[curr_day]]=fix_time(curr_hours.split(" - ")[1]);
                }
            }
            else
            {
                var begin_day=curr_day.split("-")[0].trim(), end_day=curr_day.split("-")[1].trim();
                var j;
                for(j=day_map[begin_day]; j <= day_map[end_day]; j++)
                {
                    if(curr_hours.toLowerCase().indexOf("closed")!==-1) result.closed[j]=true;
                    else
                    {
                        result.openTime[j]=fix_time(curr_hours.split(" - ")[0]);
                        result.closeTime[j]=fix_time(curr_hours.split(" - ")[1]);
                    }
                }
            }



        }
        console.log("groupon_result="+JSON.stringify(result));
        GM_setValue("groupon_result",JSON.stringify(result));



    }


    function do_FB()
    {
        console.log("Doing facebook");
         var result={closed: [], openTime: [], closeTime: [], failed:false};
        if(window.location.href.indexOf("/pg")===-1)
        {
            console.log("Failing FB");
            result.failed=true;
            GM_setValue("FB_result",JSON.stringify(result));
            return;
        }
       
        var i;
        for(i=0; i < 7; i++)
            {
                result.closed.push(false);
                result.openTime.push("");
                result.closeTime.push("");
            }
        var isAvailable=document.getElementsByClassName("_4-dp");
        if(isAvailable.length>0 && isAvailable[0].innerText==="This page isn't available")
        {
            console.log("Page not available");
            result.failed=true;
            GM_setValue("FB_result",JSON.stringify(result));
            return;
        }
        var clicker=document.getElementsByClassName("_5jau");
        if(clicker.length>1)
        {
            clicker[1].click();
        }
        else
        {
            result.failed=true;
            console.log("No clicker");
             GM_setValue("FB_result",JSON.stringify(result));
            return;
        }
        setTimeout(function() {

            var day_map={"Sunday: ": 0, "Monday: ": 1, "Tuesday: ": 2, "Wednesday: ": 3, "Thursday: ": 4, "Friday: ": 5, "Saturday: ": 6};
            var time_list=document.getElementsByClassName("_54ng");
            var i;
            console.log("Doing function");

            console.log("time_list.length="+time_list.length);
            if(time_list.length>0)
            {
                var timeslots=time_list[0].getElementsByClassName("_5-l7");
                var weekdays=time_list[0].getElementsByClassName("_4bl7");
                for(i=0; i < timeslots.length; i++)
                {
                    if(timeslots[i].innerText.toLowerCase().indexOf("closed")!==-1)
                    {
                        result.closed[(i+1)%7]=true;
                    }
                    else
                    {
                        var y_split=timeslots[i].innerText.split(",");

                        var x_split=y_split[0].split("-");

                        result.openTime[(i+1)%7]=fix_time(x_split[0].trim());
                        result.closeTime[(i+1)%7]=fix_time(x_split[1].trim());
                    }

                }
            }

            console.log("result="+JSON.stringify(result));
            GM_setValue("FB_result",JSON.stringify(result));
        }, 100);


    }
    function replacer(match, p1, p2, p3, offset, string) {
        // p1 is nondigits, p2 digits, and p3 non-alphanumerics
        var time12=parseInt(p1);
        if(p3.toLowerCase()==="pm" && time12!==12)
        {
            time12=time12+12;
        }
        else if(p3==="am" && time12==="12") time12=0;
        var hrstr="";
        if(time12<10) hrstr="0";
        hrstr=hrstr+time12;
        return hrstr+":"+p2;
    }


    function fix_time(to_fix)
    {
        to_fix=to_fix.replace(/(\d+):(\d+) ([A-Za-z][A-Za-z])/,replacer);
        return to_fix;
    }

    function init_Query()
    {
       /* var submitButtonParent=document.getElementById("submitButton").parentNode;
        var fillButtonP=document.createElement("p");
        fillButtonP.className="text-center";
        var fillButton=document.createElement("button");
        fillButtonP.appendChild(fillButton);
        fillButton.innerHTML="All Closed";
        fillButton.className="";
        fillButton.style="background-color: #B0B0B0;";

        fillButtonP.style.margin="20px 0px";
        fillButton.type="button";
        submitButtonParent.parentNode.insertBefore(fillButtonP,submitButtonParent); */
        GM_setValue("sent_yelp",false);

     
       var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        my_query={name: wT.rows[0].cells[1].innerText, address: wT.rows[1].cells[1].innerText,
                  city: wT.rows[2].cells[1].innerText, state: wT.rows[3].cells[1].innerText,
                 doneYelp: false, doneFB: false, submitted: false, yelpCount: 0, doneGroupon: false};

        GM_setValue("my_query",my_query);
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.city+" "+my_query.state+" "+my_query.name+" site:yelp.com", resolve, reject);
        });
        queryPromise.then(yelp_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });

        const FBPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.name+" "+my_query.city+" "+my_query.state+" site:facebook.com", resolve, reject);
        });
        FBPromise.then(FB_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });

        const grouponPromise = new Promise((resolve, reject) => {
            console.log("Beginning groupon search");
            query_search(my_query.name+" "+my_query.city+" "+my_query.state+" site:groupon.com", resolve, reject);
        });
        grouponPromise.then(groupon_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this groupOnPromise " + val); GM_setValue("returnHit",true); });




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
        console.log("Running yelp");
        GM_setValue("url","");
        GM_addValueChangeListener("url", function() { console.log("new url="+GM_getValue("url")); window.location.href=GM_getValue("url"); });
        do_yelp();
    }
    else if(window.location.href.indexOf("facebook.com")!==-1)
    {
        console.log("Running facebook");
        GM_setValue("FB_url","");
        if(window.location.href.indexOf("/?rf=")!==-1)
        {
            window.location.href=window.location.href.replace(/\/\?rf\=[\d]+/,"/about/?ref=page_internal");
        }
        GM_addValueChangeListener("FB_url", function() {

            var url=GM_getValue("FB_url","");
            console.log("url="+url);
            GM_setValue("new_FB",true);
            //url=url.replace(/https:\/\/www\.facebook\.com\/([^\/]+)(\/)?(.*)$/,"https://www.facebook.com/pg/$1/about/?ref=page_internal");
            console.log("new url="+GM_getValue("FB_url")); window.location.href=url; });


        setTimeout(do_FB, 1500);

    }
        else if(window.location.href.indexOf("groupon.com")!==-1)
    {
        console.log("Running Groupon");
        GM_setValue("groupon_url","");

        GM_addValueChangeListener("groupon_url", function() {

            var url=GM_getValue("groupon_url","");
            console.log("url="+url);
            GM_setValue("new_FB",true);
            //url=url.replace(/https:\/\/www\.facebook\.com\/([^\/]+)(\/)?(.*)$/,"https://www.facebook.com/pg/$1/about/?ref=page_internal");
            console.log("new url="+GM_getValue("groupon_url")); window.location.href=url; });


        setTimeout(do_groupon, 1500);

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
                }, 20000);
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