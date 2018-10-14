// ==UserScript==
// @name         ParseSchoolDirectories
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include     *
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


    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
    var my_query = {};
    var email_list=[];
    var sch_name="School District Name", sch_domain="Domain of school district";
    var bad_urls=[];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;

  

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
	    encodeURIComponent(search_str)+"&first=1&rdr=1";
	GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
            onload: function(response) { callback(response, resolve, reject); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {


    }

     function find_emails(response,appendElement) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var i,j;
        var email_val;
        var my_match;
         var email_list=[];
        if( try_specific(doc,response.finalUrl,appendElement)) return;
         var principal_url="",contact_url="",directory_url="";
        console.log("in contact response "+response.finalUrl);

        for(i=0; i < email_list.length; i++)
        {
            console.log("email_list["+i+"]="+email_list[i]);
           /* if(probably_good_email(email_list[i]))
            {
                document.getElementById("email").value=email_list[i];
                check_and_submit(check_function,automate);
                return;
            }*/
        }
         my_query.try_count++;
         if(my_query.try_count>4) return;
         var begin_url=response.finalUrl.replace(/(https:\/\/[^\/]+)\/.*$/,"$1");



    }

    /**
     * '''try_specific''' searches for a specific type of school directory format
     * that needs extra work to scrape
     * doc is parsed response.responseText from GM_xmlhttprequest
     * finalUrl is response.finalUrl from same query, appendElement is place to append non-scripts (scripts appended to head)
     */
    function try_specific(doc,finalUrl,appendElement)
    {
        var scripts=doc.scripts,i;
        var bbbutt=doc.getElementsByClassName("bb-butt");
        var staffDirectory=doc.getElementsByClassName("staffDirectoryComponent");
        if(bbbutt.length>0)
        {
            console.log("Found blackboard");
            do_blackboard(doc,finalUrl,appendElement);
            return true;
        }

        else if(staffDirectory.length>0)
        {
            console.log("Found react");
            do_react(doc,finalUrl,appendElement);
            return true;
        }
        return false;

    }




    function do_blackboard(doc,finalUrl,appendElement)
    {
        var bbbutt=doc.getElementsByClassName("bb-butt")[0];
        var onc=bbbutt.onclick;
        var FullPath=finalUrl.replace(/(https?:\/\/[^\/]+)\/.*$/,"$1");
        var regex=/SearchButtonClick\(\'([^,]+)\',\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+)/;
        var match=onc.match(regex);
        //var url= FullPath + "/site/default.aspx?PageType=2&PageModuleInstanceID=" + b + "&ViewID=" + a + "&RenderLoc=" + l + "&FlexDataID=" + f + (void 0 != r && "" != r ? "&Filter=" + encodeURIComponent(r) : "")

    }

    




    /**
     * '''do_react''' does the react-based West Corporation queries
     * doc is the parsed document from the GM_xmlhttprequest response.responseText,
     * finalUrl is response.finalUrl from same query
     */
    function do_react(doc,finalUrl,appendElement)
    {
        function increment_scripts()
        {
            if(++my_query.loadedScripts===my_query.totalScripts) loadSettings();
            else console.log("Loaded "+my_query.loadedScripts+" out of "+my_query.totalScripts+" total scripts");
        }
        console.log("Doing react");
        var scripts=doc.scripts,i,div=document.createElement("div"),script_list=[],curr_script;
        my_query.portletInstanceId=doc.getElementsByClassName("staffDirectoryComponent")[0].dataset.portletInstanceId;
        if(appendElement!==undefined) appendElement.appendChild(doc.getElementsByClassName("staffDirectoryComponent")[0]);
        var good_scripts=doc.querySelectorAll("script[id*='ctl']"), head=document.getElementsByTagName("head")[0];
        my_query.totalScripts=good_scripts.length;
        for(i=0; i<good_scripts.length; i++)
        {
            curr_script=document.createElement("script");
            curr_script.src=good_scripts[i].src;
            curr_script.onload=increment_scripts;
            script_list.push(curr_script);
            head.appendChild(curr_script);
  //          console.log("good_scripts[i].id="+good_scripts[i].id);
        }

     
    }
    /* Loads the settings, namely the groupIds which is all we need */
    function loadSettings()
    {
        var json={"portletInstanceId":my_query.portletInstanceId};
        loadReact("Settings",json,
                  function(response)
                  {
  //          console.log("response="+JSON.stringify(response)+"\n\ntext="+response.responseText);
            var r_json=JSON.parse(response.responseText);
            var i,j;
            my_query.groupIds=[];
            console.log("\n"+JSON.stringify(r_json.d.groups));
            for(i=0; i < r_json.d.groups.length; i++)
            {
//                console.log("i="+i+", "+r_json.d.groups[i]);
                my_query.groupIds.push(r_json.d.groups[i].groupID);
            }
            console.log("my_query.groupIds="+my_query.groupIds);
            loadSearch();

        });
    }

    /**
     * '''load_search''' loads the West Corporation style search query for the job title set by
     * my_query.job_title r loads the first 20 alphabetically otherwise if my_query.job_title isn't set
     *
     * Letting json_response=JSON.parse(response.responseText), json_response.d.results should have a
     * list of objects of the results to the query, with
     * fields email, firstName, lastName,jobTitle,phone,website,imageURL,userID
     *
     *
     */

    function loadSearch()
    {
        var json={"firstRecord":0,"groupIds":my_query.groupIds,"lastRecord":19,
                 "portletInstanceId":my_query.portletInstanceId,
                 "searchTerm":my_query.job_title,"sortOrder":"LastName,FirstName ASC","searchByJobTitle":true};
        if(my_query.job_title===undefined) { json.searchTerm=""; json.searchByJobTitle=false; }
         loadReact("Search",json,
                  function(response)
                  {
             //console.log("response="+JSON.stringify(response)+"\n\ntext="+response.responseText);
             var json_response=JSON.parse(response.responseText);
             console.log("result.d="+JSON.stringify(json_response.d.results));
         });
    }

    /**
     * '''loadReact''' does a GM_xmlhttprequest query of the StaffDirectory at the my_query.staff_path in question
     *
     * (my_query.staff_path to be found by searching e.g. Bing, and should be the part found by /https?:\/\/[^\/]+/
     * type is the type of query to get ("Settings" or "Search"), json is the json to send with it since it's a POST request
     * callback is the callback
     */
    function loadReact(type,json,callback)
    {
        var url=my_query.staff_path+"/Common/controls/StaffDirectory/ws/StaffDirectoryWS.asmx/"+type;
        var headers={"Content-Type":"application/json;charset=UTF-8"};
        GM_xmlhttpRequest({method: 'POST', url: url, headers:headers, data:JSON.stringify(json),
            onload: callback,
            onerror: function(response) { console.log("Fail"); },
            ontimeout: function(response) { console.log("Fail"); }
            });
    }







    function init_Query()
    {
//        var dont=document.getElementsByClassName("dont-break-out")[0].href;
  //      var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
      document.getElementById("rlblock_left").innerHTML="<b>Testing</b>";
        document.getElementById("ads").innerHTML="<div id=\"divReactPortletCSS\"></div>";
        var url="https://swanscreekes.pwcs.edu/staff_directory";
           my_query={loadedScripts:0,totalScripts:0,url:url,job_title:"principal"};
        my_query.staff_path=url.match(/^https?:\/\/[^\/]+/)[0];
        var appendElement=document.getElementById("ads");
        GM_xmlhttpRequest({method: 'GET', url: url,
            onload: function(response) { find_emails(response,appendElement); },
            onerror: function(response) { console.log("Fail"); },
            ontimeout: function(response) { console.log("Fail"); }
            });
     
	var search_str;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });





    }
    if(window.location.href.indexOf("tryshit.com")!==-1)
    {
        init_Query();
    }



})();
