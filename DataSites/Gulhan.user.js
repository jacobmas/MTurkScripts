// ==UserScript==
// @name         Gulhan
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Do Gulhan
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
// @include https://*.yelp.com/*
// @include https://*facebook.com/*
// @include https://www.manta.com/*
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
// @connect manta.com
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

  var manta_key_map={"0752":{"value":"ANIMAL_SHELTER_KENNEL","text":""},
                    "7389":{"value":"OTHER_OFFICE","text":"Business Services"},
                    "3999":{"value":"OTHER_MANUFACTURING_INDUSTRIAL_PLANT","text":"Manufacturing general"},
                     "5722":{"value":"ELECTRONICS_STORE"},
                     "8641":{"value":"SOCIAL_MEETING_HALL"}
                    };
    var manta_naics_map={"5413":{"value":"OTHER_TECHNOLOGY_SCIENCE","text":"Architectural, Engineering, and Related Services"},
                         "111":{"value":"AGRICULTURE_FARM"},
                         "112":{"value":"AGRICULTURE_FARM"},
                         "2211":{"value":"ENERGY_POWER_STATION"},
                         "238":{"value":"CONTRACTOR"},
                         "23822":{"value":"PLUMBER_OFFICE"},
                         "311":{"value":"FOOD_PROCESSING"},
                         "321":{value:"OTHER_MANUFACTURING_INDUSTRIAL_PLANT",text:"Wood product manufacturing"},
                         "323":{"value":"COPY_PRINTING_SHOP","text":""},
                         "3272":{value:"OTHER_MANUFACTURING_INDUSTRIAL_PLANT",text:"Glass and Glass Product Manufacturing"},
                         "331":{"value":"METAL_FABRICATION"},
                         "332":{"value":"METAL_FABRICATION"},

                         "333":{value:"OTHER_MANUFACTURING_INDUSTRIAL_PLANT",text:"Machinery Manufacturing"},

                        "423":{"value":"WAREHOUSE"},
                         "424":{"value":"WAREHOUSE"},
                         "4411":{"value":"AUTOMOBILE_DEALERSHIP"},
                         "4412":{"value":"AUTOMOBILE_DEALERSHIP"},
                         "4413":{"value":"OTHER_RETAIL","text":"Automotive Parts, Accessories, and Tire Store"},
                         "442":{"value":"OTHER_RETAIL","text":"Furniture Store"},
                         "443":{"value":"ELECTRONICS_STORE"},
                         "444":{"value":"OTHER_RETAIL","text":"Building Material and Garden Equipment and Supplies Dealer"},
                         "446":{"value":"OTHER_RETAIL","text":"Health and Personal Care Stores"},
                         "44511":{"value":"SUPERMARKET_GROCERY_STORE"},
                         "44611":{"value":"PHARMACY"},


                         "448":{"value":"CLOTHING_STORE"},
                         "452":{"value":"OTHER_RETAIL","text":"General Merchandise Store"},
                         "45322":{"value":"OTHER_RETAIL","text":"Gift, Novelty, and Souvenir Store"},
                        "488":{"value":"OTHER_SERVICES","text":"Support Activities for Transportation"},
                        "51111":{"value":"OTHER_OFFICE","text":"Newspaper"},
                        "532":{"value":"OTHER_RETAIL","text":"Leasing and Rental"},
                         "5321":{"value":"CAR_TRUCK_RENTAL"},
                         "5611":{"value":"REAL_ESTATE_PROPERTY_MANAGEMENT_OFFICE"},
                         "5617":{"value":"CONTRACTOR"},
                         "562":{"value":"OTHER_SERVICES","text":"Waste management and remediation"},
                         "6111":{"value":"SCHOOL"},
                         "6211":{"value":"DOCTOR_OFFICE"},
                         "6213":{"value":"DOCTOR_OFFICE"},
                         "62191":{"value":"OTHER_HEALTHCARE","text":"Ambulances"},
                         "623":{"value":"SENIOR_CARE_COMMUNITY_ASSISTED_LIVING"},
                         "624":{"value":"OTHER_OFFICE","text":"Social Assistance"},
                         "7224":{"value":"BAR_NIGHTCLUB"},
                         "71394":{"value":"FITNESS_CENTER_HEALTH_CLUB_GYM"},
                         "811":{"value":"OTHER_SERVICES","text":"Repair and Maintenance"},
                         "8111":{"value":"AUTO_REPAIR_SHOP"},
                         "81143":{"value":"SHOE_REPAIR"},
                         "8121":{"value":"BEAUTY_SALON_BARBER_SHOP"},

                         "8122":{"value":"FUNERAL_HOME"},
                        "9211":{"value":"CITY_HALL_CENTER"}
                        };
    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
    var my_query = {};
    var email_list=[];
    var sch_name="School District Name", sch_domain="Domain of school district";
    var bad_urls=["yelp.com/user_details?","https://www.yelp.com/search?","www.yelp.com/biz_photos","www.yelp.com/map/"];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;

    var fb_keywords_map={"Signs & Banner Service":{value:"OTHER_RETAIL",text:"Signs & Banner Service"},
                        "Taxidermist":{value:"OTHER_SERVICES",text:"Taxidermist"},
                         "Waste Management Company":{value:"OTHER_PUBLIC_SERVICES",text:"Waste Management Company"},
                         "Sporting Goods Store":{value:"OTHER_RETAIL",text:"Sporting Goods Store"}
                        };

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
        var prefix_re=/site%3A([^\.]*)\.com/;
        var prefix_match=response.finalUrl.match(prefix_re);
        var prefix="";
        if(prefix_match!==null) prefix=prefix_match[1];
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow, b_caption;
        var b1_success=false, b_header_search;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            console.log(prefix+": b_algo.length="+b_algo.length);
            if(b_algo.length===0)
            {
                console.log(prefix+": b_algo length=0");
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

                b_caption=b_algo[i].getElementsByClassName("b_caption");
                if(b_caption.length>0) b_caption=b_caption[0].innerText;
                console.log(prefix+": b_url="+b_url+"\tb_name="+b_name);

                if(!is_bad_url(b_url,bad_urls,-1))
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

    function manta_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");


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

            for(i=0; i < b_algo.length && i < 8; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;

                var b_name_split=b_name.split(" - ");

                console.log("i="+i+", b_name="+b_name);
                b_name=b_name.replace(" & "," and ");
                if(b_name.toLowerCase().indexOf(my_query.name.toLowerCase())!==-1)
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
console.log("Nothing found via manta");
        var lname=my_query.name.toLowerCase();

        if(lname.indexOf("dairy")!==-1 || lname.indexOf("farm")!==-1)
        {
            do_manta_last({naics: "112",isicV4:""});
            return;
        }
         reject("Nothing found via Manta");
         //        GM_setValue("returnHit",true);
         return;


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

      function manta_promise_then(url) {
         console.log("IN manta_promise_then");
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
                   "foundingDate":"","isicV4":"","naics":""};
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
        if(result2["isicV4"].length>0 || result2["naics"].length>0)
        {

            console.log("Success with manta");
            do_manta_last(result2);

            return;
        }

        console.log("Manta failed");
        my_query.doneManta=true;


    }



    function do_manta_last(result)
    {
        var the_radio;
        var done;
        var the_map;
        console.log("NAICS="+result.naics+"\tSIC="+result.isicV4);
        var x;
        if(result["naics"].length>0)
        {
            for(x=result.naics.length; x>=2; x--)
            {
                the_map=manta_naics_map[result.naics.substr(0,x)];
                if(the_map!==undefined) break;
            }
        }
        if(the_map===undefined && result.isicV4.length>0) the_map=manta_key_map[result["isicV4"]];
        if(the_map!==undefined)
        {
            var inner_selector="input[value='"+the_map.value+"']";
            console.log("inner_selector="+inner_selector);
            the_radio=document.querySelector(inner_selector);
            if(the_radio!==null && the_radio!==undefined)
            {
                console.log("*** Found radio");
                the_radio.checked=true;
                if(the_map.text!==undefined)                document.getElementsByName("Q5FreeTextInput")[0].value=the_map.text;
                done=true;
                my_query.success=true;
            }
        }
        my_query.doneManta=true;
        do_finish();
    }
    /* Following the finding the district stuff */


    function do_finish()
    {
        console.log("Doing finish");
         if(my_query.doneManta && !my_query.submitted && my_query.success)
            {
                my_query.submitted=true;

                check_and_submit(check_function,automate);
            }
        else if(my_query.doneManta  && !my_query.submitted)
        {
            console.log("Done everything, failed!!!");
        }
    }

    function FB_promise_then(url) {
        GM_setValue("FB_result","");

        GM_addValueChangeListener("FB_result", function()
                                  {
            var result=arguments[2];
            console.log("result="+JSON.stringify(result));
            var i;
            var done=false;
            var curr_word;
            var the_radio;
            for(i=0; i < result.keywords.length; i++)
            {
                curr_word=result.keywords[i];
                console.log("curr_word="+curr_word);
                if(fb_keywords_map[curr_word]!==undefined)
                {
                    var inner_selector="input[value='"+fb_keywords_map[curr_word].value+"']";
                    console.log("inner_selector="+inner_selector);
                    the_radio=document.querySelector(inner_selector);
                    if(the_radio!==null && the_radio!==undefined)
                    {
                        console.log("*** Found radio");
                        the_radio.checked=true;
                        document.getElementsByName("Q5FreeTextInput")[0].value=fb_keywords_map[curr_word].text;
                        done=true;
                    }
                    my_query.success=true;

                }
                if(done) break;
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
    /* Parse searching manta */
    function parse_manta_search()
    {
        my_query=GM_getValue("my_query");
        console.log("my_query="+JSON.stringify(my_query));
       // var doc = document;/*new DOMParser()
   //     .parseFromString(response.responseText, "text/html");*/
       // console.log("response.finalUrl="+response.finalUrl);
        var i,j;
        var the_div=document.querySelector("[itemprop='isPartOf']");
        var list_item;
        var list_group=the_div.getElementsByClassName("mbn");
        for(i=0; i < list_group.length; i++)
        {
            if(list_group[i].className.indexOf("list-group")!==-1) break;
        }
        list_item=list_group[i].getElementsByClassName("list-group-item");
        var streetAddress, addressLocality, addressRegion, postalCode;
        var field_list=["name","streetAddress","addressLocality","addressRegion","postalCode"];
        var field_elems={};
        var query_num=-1;
        var inner_a;
        var query_num_match=my_query.address.match(/^([A-Z\d]*)\s/);
        var num_match;
        if(query_num_match!==null)
        {
            query_num=query_num_match[1];
            console.log("query_num="+query_num);
        }
        var manta_success=false;
        console.log("list_item.length="+list_item.length);
        for(i=0; i < list_item.length && i < 10; i++)
        {
          //  console.log("list_item[i].innerHTML="+list_item[i].innerHTML);
            inner_a=list_item[i].getElementsByTagName("a")[0].href;//.replace(/https:\/\/[^\/]+\//,"https://www.manta.com/");
            for(j=0; j < field_list.length; j++)
            {
                console.log("[itemprop='"+field_list[j]+"']");
                try
                {
                    field_elems[field_list[j]]=list_item[i].querySelector("[itemprop='"+field_list[j]+"']").innerText;
                                   console.log("field_elems["+field_list[j]+"]="+field_elems[field_list[j]]);
                }
                catch(error) { field_elems[field_list[j]]=""; }

            }
            num_match=field_elems.streetAddress.match(/^([A-Z\d]*)\s/);
            console.log("num_match="+num_match);
            //console.log("num_match!==null && num_match[1]===query_num_match="+(num_match[1]===query_num));
            if(field_elems.postalCode.substr(0,5)===my_query.zip.substr(0,5) &&
                (field_elems.name!==undefined && (field_elems.name.toLowerCase().indexOf(my_query.name.toLowerCase())!==-1 ||
                                                  my_query.name.toLowerCase().indexOf(field_elems.name.toLowerCase())!==-1))

                ||(num_match!==null && num_match[1]===query_num))
            {
                console.log("Success with finding it, going to "+inner_a);
               GM_setValue("manta_page_url",inner_a);
                return;

            }


        }
         GM_setValue("manta_page_url","fail");

    }

    
 

    function do_FB()
    {
        console.log("Doing facebook");
         var result={keywords:[],failed:false};
        var links=document.links;
        var i,j;
        //var keywords=[];
        if(window.location.href.indexOf("/pg")===-1)
        {
            for(i=0; i < links.length; i++)
            {
                if(links[i].href.indexOf("/places/intersect")!==-1)
                {
                    result.keywords.push(links[i].innerText);
                    break;
                }
            }
            //console.log("Failing FB");
            //result.failed=true;
            GM_setValue("FB_result",result);
            return;
        }
        for(i=0; i < links.length; i++)
        {
            console.log("links["+i+"].href="+links[i].href);
            if(links[i].href.indexOf("/keywords_pages/")!==-1)
            {
                result.keywords.push(links[i].innerText);
            }
        }
        GM_setValue("FB_result",result);

    }


    function init_Query()
    {
        GM_setValue("sent_yelp",false);


       var wT=document.getElementById("Other").getElementsByTagName("table")[0];
        my_query={name: wT.rows[1].cells[1].innerText, address: wT.rows[2].cells[1].innerText,
                  city: wT.rows[3].cells[1].innerText, zip: wT.rows[4].cells[1].innerText, state: wT.rows[5].cells[1].innerText,
                  doneFB: false, submitted: false,  doneManta: false, success: false};

        GM_setValue("my_query",my_query);

       /* const FBPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.name+" "+my_query.city+" "+my_query.state+" site:facebook.com", resolve, reject,query_response);
        });
        FBPromise.then(FB_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this fbPromise " + val); GM_setValue("returnHit",true); });*/

       const mantaPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
           var manta_search_str="https://www.manta.com/search?search_source=nav&search="+my_query.name.replace(/\s/g,"+")+"&search_location="+
               (my_query.city+" "+my_query.state).replace(/\s/g,"+");
           GM_setValue("manta_page_url","");
           GM_addValueChangeListener("manta_page_url",function() {
               console.log("arguments="+JSON.stringify(arguments));
                                     var url=arguments[2];
               if(url=="fail")
               {
                   query_search(my_query.name+" "+my_query.city+" "+my_query.state+" site:manta.com",resolve,reject,manta_response);
                   return;
               }
               console.log("Calling manta_promise_then");
               manta_promise_then(url);
           });

           GM_setValue("manta_url",manta_search_str);

/*           GM_xmlhttpRequest({
               method: 'GET', url:    manta_search_str,
               onload: function(response) { parse_manta_search(response, resolve, reject); },
               onerror: function(response) { reject("Failed manta search"); }, ontimeout: function(response) { reject("Failed manta search"); }
           });*/


          //  query_search(my_query.name+" "+my_query.city+" "+my_query.state+" site:facebook.com", resolve, reject,query_response);
        });
        mantaPromise.then(manta_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this mantaPromise " + val); GM_setValue("returnHit",true); });



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
        GM_addValueChangeListener("manta_url", function() { var url=GM_getValue("manta_url"); window.location.href=url; });
        if(window.location.href.indexOf("/search?")!==-1)
        {
            console.log("Ready to parse manta");
            setTimeout(parse_manta_search,1000);
        }
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