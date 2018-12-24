// ==UserScript==
// @name         AlexChopra
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
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
// @grant GM_setClipboard
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,200,[],init_Query,"A2HB6JR01PAJNX");
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        var lower_b=b_name.toLowerCase(),lower_my=my_query.name.toLowerCase();
        if(lower_b.indexOf(lower_my)!==-1) return false;
        return true;
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption="";
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                }
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !is_bad_name(b_name))
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
            reject(error);
            return;
        }
        reject("Nothing found");
        //        GM_setValue("returnHit",true);
        return;

    }

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

    function begin_script(timeout,total_time,callback) {
        if(MTurk!==undefined) { callback(); }
        else if(total_time<5000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }

    function add_to_sheet() {
        var x,field;
        var field_map={"addressLine1":"Address","zip5":"Zip","zip4":"ZIPLast4","DUNS":"DUNS","CAGE":"CAGE",
                      "first":"EPOCFirstName","last":"EPOCLastName","phone":"EPOCPhone","small_business":"SmallBusiness","email":"EPOCEmail"};
        for(x in my_query.fields) {
            if((field=document.getElementsByName(field_map[x])).length>0)
            {
                console.log("my_query.fields["+x+"]="+my_query.fields[x]);
                field[0].value=my_query.fields[x].trim();
            }
        }
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }
    var CLIENT_ID = '389791042446-dftp5hg7kulbu4k32f6s2l4kgn7q2fl3.apps.googleusercontent.com';
      var API_KEY = 'AIzaSyAoHAO9JXgVcYDS4sCrfqMMnKHZZ90nxGE';
    var spreadsheetId="1ge8W1IZgHbwk_vK2EjW6qdgpmlyg-L1Pq_rVV2uo9Ts";

      // Array of API discovery doc URLs for APIs used by the quickstart
      var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

      // Authorization scopes required by the API; multiple scopes can be
      // included, separated by spaces.
      var SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

      var authorizeButton = document.getElementById('authorize_button');
      var signoutButton = document.getElementById('signout_button');

      /**
       *  On load, called to load the auth2 library and API client library.
       */
      function handleClientLoad() {
        gapi.load('client:auth2', initClient);
      }

      /**
       *  Initializes the API client library and sets up sign-in state
       *  listeners.
       */
      function initClient() {
        gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES
        }).then(function () {
            start_google();
          // Listen for sign-in state changes.
         // gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

          // Handle the initial sign-in state.

        }, function(error) {
          console.log(JSON.stringify(error, null, 2));
        });
      }

    /* first SAM */
    function parse_SAMsearch1(doc,url,resolve,reject) {
        console.log("in parse_SAMsearch1, url="+url);
        var viewstate=doc.getElementsByName("javax.faces.ViewState")[0];
        var new_url="https://www.sam.gov/SAM/pages/public/searchRecords/search.jsf";
        var data={
            "javax.faces.partial.ajax": "true",
"javax.faces.source": "searchBasicForm:qterm",
"javax.faces.partial.execute": "searchBasicForm:qterm",
"javax.faces.partial.render": "searchBasicForm:qterm",
"searchBasicForm:qterm": "searchBasicForm:qterm",
"searchBasicForm:qterm_query": my_query.name,
"searchBasicForm": "searchBasicForm",
"searchBasicForm:qterm_input": my_query.name,
"searchBasicForm:DUNSq":"",
"searchBasicForm:Cageq":"",

                  "javax.faces.ViewState": viewstate.value,
                 };
        var headers={"Content-Type":"application/x-www-form-urlencoded",
	"Host": "www.sam.gov",
                     "Faces-Request": "partial/ajax",
                     "X-Requested-With": "XMLHttpRequest",

"Origin": "https://www.sam.gov",
"Referer": "https://www.sam.gov/SAM/pages/public/searchRecords/search.jsf",
"Upgrade-Insecure-Requests": "1"};
        console.log("data="+JSON.stringify(data));
        var data_str=MTP.json_to_post(data);
        console.log("Doing parse_SAMsearch1 ");
        GM_xmlhttpRequest({method: 'POST', url: new_url,data:data_str,headers:headers,
                           onload: function(response) {

                               var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
                               parse_SAMsearch1A(doc,response.finalUrl, resolve, reject,viewstate); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });


    }
    function parse_SAMsearch1A(doc,url,resolve,reject,good_name) {
        console.log("in parse_SAMsearch1A, url="+url);
        console.log("doc.body.innerHTML="+doc.body.innerHTML);
       /* doc.body.innerHTML=doc.body.innerHTML.replace(/<!--\[CDATA\[([^\]]*)\]\]-->/,"$1").replace(/-->/,">").replace(/<!--\[CDATA\[/,"")
        .replace("]]\&gt;","</ul>").replace(/<update id\=\"j_id1/,"</update><update id=\"j_id1")*/
        ;//.replace(/<!--\[CDATA\[/g,"");//.replace(/\]\]-->/,">");
        //.replace("]]&gt;","").replace("]]--&gt;","")
//        .replace(/\]\]--/,"").replace("></update>","</update>");
        //console.log("doc.getElementsByTagName(changes)="+doc.getElementsByTagName("changes")[0].innerText);
       console.log("doc.body.innerHTML="+doc.body.innerHTML);
        var hstring=doc.body.innerHTML.toString();
        var auto=hstring.match(/data\-item\-value\s*\=\s*\"([^\"]+)\"/);
        console.log("auto="+auto);
        if(auto===null) auto=my_query.name;
        else auto=auto[1].replace(/\&amp;/,"&");

        var viewstate=hstring.match(/[-\d]+:[-\d]+/)[0];//getElementsByName("javax.faces.ViewState")[0];
        console.log("viewstate="+viewstate);
        var new_url="https://www.sam.gov/SAM/pages/public/searchRecords/search.jsf";
        var data={"searchBasicForm":"searchBasicForm",
                  "searchBasicForm:qterm_input": auto,
                  "searchBasicForm:DUNSq":"",
                  "searchBasicForm:Cageq":"",
                  "javax.faces.ViewState": viewstate,
                  "searchBasicForm:SearchButton": "searchBasicForm:SearchButton",
                  "searchButton":"searchButton"};
        var headers={"Content-Type":"application/x-www-form-urlencoded",
	"Host": "www.sam.gov",
                    
"Origin": "https://www.sam.gov",
"Referer": "https://www.sam.gov/SAM/pages/public/searchRecords/search.jsf",
"Upgrade-Insecure-Requests": "1",
                    };
        console.log("data="+JSON.stringify(data));
        var data_str=MTP.json_to_post(data);
        console.log("Doing parse_SAMsearch1 ");
        GM_xmlhttpRequest({method: 'POST', url: new_url,data:data_str,headers:headers,
                           onload: function(response) {

                               var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
                               parse_SAMsearch2(doc,response.finalUrl, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });


    }


    function parse_SAMsearch2(doc,url,resolve,reject) {
        console.log("in parse_SAMsearch2"+doc.body.innerHTML);
        var the_inps=doc.querySelectorAll("#search_results input[type='submit']"),i;
        var click_match,parsed;


        for(i=0;i<the_inps.length; i++) {
            click_match=the_inps[i].outerHTML.match(/\{[^\}]+\}/);
            if(click_match) {
                try
                {
                    click_match[0]=click_match[0].replace(/\'/g,"\"");
                    parsed=JSON.parse(click_match[0].trim());
                    create_details_query(doc,url,resolve,reject,parsed);
                    break;


                }
                catch(error) { console.log("error parsing "+click_match[0].trim()); }
            }
            else { console.log("the_inps["+i+"].outerHTML="+the_inps[i].outerHTML); }
            break;
        }
    }
    function create_details_query(doc,url,resolve,reject,parsed) {
        var viewstate=doc.getElementsByName("javax.faces.ViewState")[0];
        var new_url="https://www.sam.gov/SAM/pages/public/searchRecords/searchResults.jsf";
        var data={"searchResultsID": "searchResultsID",
"searchResultsID":"slsortBy: _score",
"searchResultsID:sortBy":"desc",
"searchResultsID:lqStatusActive":"on",
"javax.faces.ViewState":viewstate.value,
"searchResultsID:j_idt155:0:viewDetails": parsed["searchResultsID:j_idt155:0:viewDetails"],
"orgId": parsed.orgId,
"pitId": parsed.pitId,
"fromModule": parsed.fromModule};
        var headers={"Content-Type":"application/x-www-form-urlencoded",
	"Host": "www.sam.gov",
"Origin": "https://www.sam.gov",
"Referer": "https://www.sam.gov/SAM/pages/public/searchRecords/searchResults.jsf",
"Upgrade-Insecure-Requests": "1"};
        var data_str=MTP.json_to_post(data);
        console.log("Doing create_details_query ");
        GM_xmlhttpRequest({method: 'POST', url: new_url,data:data_str,headers:headers,
                           onload: function(response) {
                               var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
                               parse_SAMsearch3(doc,response.finalUrl, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });

    }

    function parse_SAMsearch3(doc,url,resolve,reject) {
        var content=doc.getElementsByClassName("contentDiv")[0];
        var tab=content.getElementsByTagName("table"),zipmatch;
        console.log("tab[0].rows[1].innerText="+tab[0].rows[1].innerText);
        var match1=tab[0].rows[1].cells[0].innerText.match(/DUNS:\s*([\dA-Z]+)/);
        var match2=tab[0].rows[1].cells[0].innerText.match(/CAGE Code:\s*([\dA-Z]+)/);
        my_query.official_name=tab[0].rows[0].cells[0].innerText;
        my_query.fields.DUNS=match1?match1[1]:"";
        my_query.fields.CAGE=match2?match2[1]:"";
        my_query.fields.addressLine1=tab[1].rows[0].innerText;
        my_query.addressLine2=tab[1].rows[1].innerText;
        zipmatch=my_query.addressLine2.match(/([\d]{5})(?:-([\d]{4}))?/);
        my_query.fields.zip5=zipmatch&&zipmatch.length>=2?zipmatch[1]:"";
        my_query.fields.zip4=zipmatch&&zipmatch.length>=3?zipmatch[2]:"";
        if(my_query.fields.zip4===undefined) my_query.fields.zip4="";
        add_to_sheet();
        create_poc_query(doc,url,resolve,reject);

    }

    function create_poc_query(doc,url,resolve,reject) {
        var viewstate=doc.getElementsByName("javax.faces.ViewState")[0];
        var new_url="https://www.sam.gov/SAM/pages/public/entitySearch/entitySearchEntityOverview.jsf";
        var data={"entitySearchForm": "entitySearchForm",
                  "entitySearchForm:entitySearchNavControl:entitySearchNavControl": "entitySearchForm:entitySearchNavControl:entitySearchNavControl",
                  "javax.faces.ViewState":viewstate.value,
                  "entitySearchForm:entitySearchpocDetails": "entitySearchForm:entitySearchpocDetails",
                  "entityType": "entitySearch",
                  "entityID": "entitySearchpocDetails"};
        var headers={"Content-Type":"application/x-www-form-urlencoded",
	"Host": "www.sam.gov",
"Origin": "https://www.sam.gov",
"Referer": "https://www.sam.gov/SAM/pages/public/entitySearch/entitySearchEntityOverview.jsf",
"Upgrade-Insecure-Requests": "1"};
        var data_str=MTP.json_to_post(data);
        console.log("Doing create_poc_query ");
        GM_xmlhttpRequest({method: 'POST', url: new_url,data:data_str,headers:headers,
                           onload: function(response) {
                               //console.log("response="+JSON.stringify(response));
                               var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
                               parse_SAMsearch4(doc,response.finalUrl, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });

    }
    function parse_SAMsearch4(doc,url,resolve,reject) {
        console.log(" in parse_samsearch4 "+JSON.stringify(my_query));
        var accordion=doc.getElementById("mandatoryAccordion");


        var tab=accordion.getElementsByTagName("table"),i,j,k,row;
        for(i=0; i < tab.length; i++) {
            console.log("tab["+i+"].rows[0].cells[0].innerText="+tab[i].rows[0].cells[0].innerText);
            if(/Electronic Business POC/i.test(tab[i].rows[0].cells[0].innerText)) {
                for(j=1;j<tab[i].rows.length; j++) {
                    row=tab[i].rows[j];
                    console.log("row["+j+"].innerText="+row.cells[0].innerText+", "+row.cells[1].innerText);
                    if(/First Name/i.test(row.cells[0].innerText)) my_query.fields.first=row.cells[1].innerText;
                    if(/Last Name/i.test(row.cells[0].innerText)) my_query.fields.last=row.cells[1].innerText;
                    if(/^US Phone/i.test(row.cells[0].innerText)) my_query.fields.phone=row.cells[1].innerText;
                }
            }
        }
        add_to_sheet();
        create_rep_search(doc,url,resolve,reject);
    }
    function create_rep_search(doc,url,resolve,reject) {
        var viewstate=doc.getElementsByName("javax.faces.ViewState")[0];
        var new_url="https://www.sam.gov/SAM/pages/public/entitySearch/entitySearchpocDetails.jsf";
        var data={"entitySearchForm": "entitySearchForm",
                  "entitySearchForm:entitySearchNavControl:entitySearchNavControl": "entitySearchForm:entitySearchNavControl:entitySearchNavControl",
                  "javax.faces.ViewState":viewstate.value,
                  "entitySearchForm:entitySearchrepsReview": "entitySearchForm:entitySearchrepsReview",
"entityType": "entitySearch",
"entityID": "entitySearchrepsReview"};
        var headers={"Content-Type":"application/x-www-form-urlencoded",
	"Host": "www.sam.gov",
"Origin": "https://www.sam.gov",
"Referer": "https://www.sam.gov/SAM/pages/public/entitySearch/entitySearchpocDetails.jsf",
"Upgrade-Insecure-Requests": "1"};
        var data_str=MTP.json_to_post(data);
        console.log("Doing create_rep_search ");
        GM_xmlhttpRequest({method: 'POST', url: new_url,data:data_str,headers:headers,
                           onload: function(response) {
                               //console.log("response="+JSON.stringify(response));
                               var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
                               parse_SAMsearch5(doc,response.finalUrl, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });

    }


    function parse_SAMsearch5(doc,url,resolve,reject) {

        var naics=doc.querySelector("#myNaicsTableMain .repNaicscolumnNew5");
        my_query.fields.small_business=naics.innerText;
        add_to_sheet();
        /* try to guess govtribe */
       
         console.log(" in parse_samsearch5 "+JSON.stringify(my_query));
        try_gov_tribe(resolve,reject);
         
    }
    function try_gov_tribe(resolve,reject) {
        if(my_query.try_count===0) {
             my_query.govtribe_name=(my_query.full_name.trim().replace(/ dba(\.)? /," ").replace(/\./g,"-dot")
                                     .replace(/ \&/,"").replace(/,/g,"").replace(/\s/g,"-").trim()
        +"-"+my_query.fields.CAGE).toLowerCase();
        my_query.govtribe_url="https://govtribe.com/vendors/"+my_query.govtribe_name;

        }
        else if(my_query.try_count===1) {
           my_query.full_name=my_query.full_name+" "+my_query.full_name.replace(/,.*$/,"");
             my_query.govtribe_name=(my_query.full_name.trim().replace(/ dba(\.)? /," ").replace(/\./g,"-dot").replace(/,/g,"").replace(/\s/g,"-").trim()
        +"-"+my_query.fields.CAGE).toLowerCase();
        my_query.govtribe_url="https://govtribe.com/vendors/"+my_query.govtribe_name;
        }
        GM_xmlhttpRequest({method: 'GET',url:my_query.govtribe_url, anonymous:true,
                               onload: function(response) {
                                   console.log("response="+JSON.stringify(response));
                                   var doc = new DOMParser()
                                   .parseFromString(response.responseText, "text/html");
                                   if(my_query.try_count===0 && response.status===404) {
                                       console.log("MOO1");
                                       my_query.try_count++; try_gov_tribe(resolve,reject); return; }
                                   parse_govtribe(doc,response.finalUrl, resolve, reject); },
                               onerror: function(response) { reject("Fail"); },
                               ontimeout: function(response) { reject("Fail"); }
                              });
    }

    function parse_govtribe(doc,url,resolve,reject) {
        var scripts=doc.scripts,i,parsed,rx=/^window\.__INITIAL_STATE__\s*\=\s*/,text;
        for(i=0; i < scripts.length;i++) {
            if(rx.test(scripts[i].innerHTML)) {
                text=scripts[i].innerHTML.replace(rx,"").replace(/;\s*$/,"").trim();
                //console.log("text="+text);
                parsed=JSON.parse(text);
                break;
            }
        }
        var people=parsed.mutations[0].data[0].vendorContactPeople;
        console.log("people="+JSON.stringify(people));
        for(i=0;i<people.length;i++) {
            console.log("people["+i+"].name.toLowerCase()="+people[i].name.toLowerCase());
            if(people[i].name.toLowerCase().indexOf(my_query.fields.first.trim().toLowerCase())!==-1 &&
               people[i].name.toLowerCase().indexOf(my_query.fields.last.trim().toLowerCase())!==-1) {
                my_query.person=people[i];
                my_query.fields.email=people[i].emailAddress;
            }

        }
        add_to_sheet();

    }

    function submit_to_google(doc,url,resolve,reject) {
        var values = [
            [
                my_query.name,my_query.addressLine1,my_query.city,my_query.state,my_query.zip5,my_query.zip4,
                my_query.CAGE,my_query.DUNS,my_query.first,my_query.last,my_query.email,my_query.phone,
                my_query.small_business
            ],
        ];
        var body = {
            values: values
        };
        var range="A"+my_query.row+":M"+my_query.row;
        var valueInputOption="RAW";
        console.log("values="+JSON.stringify(values));
        gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: range,
            valueInputOption: valueInputOption,
            resource: body
        }).then((response) => {
            var result = response.result;
            console.log(" cells updated."+JSON.stringify(result));
        });
    };



    /* The actual queries */
    function start_google() {
        console.log("Starting google");
        var range="A"+my_query.row+":M"+my_query.row;
        console.log("range="+range);
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: range
        }).then((response) => {
            console.log("IN END GOOGLE");
            var result = response.result;
            var numRows = result.values ? result.values.length : 0;
            //console.log("${numRows} rows retrieved.");
            console.log("result="+JSON.stringify(result));
            my_query.name=result.values[0][0];
            my_query.city=result.values[0][2];
            my_query.state=result.values[0][3];
            var promise=MTP.create_promise("https://www.sam.gov/SAM/pages/public/searchRecords/search.jsf",parse_SAMsearch1,done_SAM);
});
    }
    function begin_SAM() {
        var promise=MTP.create_promise("https://www.sam.gov/SAM/pages/public/searchRecords/search.jsf",parse_SAMsearch1,done_SAM);
    }
    /* When done with SAM */
    function done_SAM() {
    }

    /* load google shit */
    function load_script() {
        console.log("in load script");
        var the_script=document.createElement("script");
        the_script.src="https://apis.google.com/js/api.js";
        the_script.onload=function(){
            console.log("MOO");
            handleClientLoad() };
        the_script.onreadystatechange=function(response) {

            console.log("hello "+response);
            if (this.readyState === 'complete') this.onload(); };
        document.head.appendChild(the_script);
    }


    function init_Query()
    {
        console.log("in init_query");
        var i;
        var the_li=document.querySelector("#Other li").innerText;
        console.log("the_li="+the_li.innerText);

//        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
  //      var dont=document.getElementsByClassName("dont-break-out");
        var ingroup=document.getElementsByClassName("input-group");
        var match=the_li.match(/^(.*)\s*is located in\s*([^,]+),\s*([A-Z]+)/);
        console.log("the_li="+the_li+", match="+JSON.stringify(match));
        my_query={full_name:match[1].trim(),name:match[1].trim().replace(/ dba(\.)? .*$/,""),try_count:0,
                  city:match[2].trim(),state:match[3].trim(),fields:{}};
        console.log("my_query="+JSON.stringify(my_query));
        begin_script(200,0,begin_SAM);


    }

})();