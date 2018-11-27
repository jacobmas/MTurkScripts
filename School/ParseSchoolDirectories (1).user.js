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
// @connect http*tryshit.com*
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/MTurkScript.js
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

    /**
     * TODO: parse state level directories
     *
     * NE: http://educdirsrc.education.ne.gov/
     * OH: https://oeds.ode.state.oh.us/SearchOrg
     * OK: https://sde.ok.gov/state-school-directory
     * OR: (couldn't find)
     * PA: http://www.edna.pa.gov/Screens/wfSearchEntity.aspx (no emails)
     * RI: http://www2.ride.ri.gov/Applications/MasterDirectory/Organization_List.aspx
     * SC: https://ed.sc.gov/districts-schools/schools/school-directory/?activetab=search
     * SD: https://doe.sd.gov/ofm/edudir.aspx
     * TN: https://k-12.education.tn.gov/sde/CreateDistrictList.asp?status=A&activeonly=Y
     * TX: http://tea4avholly.tea.state.tx.us/TEA.AskTED.Web/Forms/SearchScreen.aspx?orgType=State
     * VA: http://www.va-doeapp.com/StaffBySchoolDivisions.aspx?w=true
     * WA: https://eds.ospi.k12.wa.us/DirectoryEDS.aspx
     * WI: https://apps4.dpi.wi.gov/SchoolDirectory/Search/PublicSchoolsSearch
     */

    /**
     * TODO:  school website site examples
     *  https://www.bighorn1.com/,https://www.fortwashakieschool.com/,http://www.ansonschools.org/ (Cyberschool & IES Inc.)
     *
     * https://www.bgh2.org/,http://www.csd400.org/,https://www.gsd.wednet.edu/,https://www.elkhartisd.org/,https://www.westwoodisd.net/
     * https://www.huntingtonisd.com, (Edlio [already known widely used])
     *
     * https://www.ccsd.k12.wy.us/,https://www.berkeleycountyschools.org/,https://www.aasd.wednet.edu/
     * https://www.auburn.wednet.edu/,https://www.elginisd.net/,https://www.alleghany.k12.nc.us/ (Blackboard [already known widely used])
     *
     * https://wv01919545.schoolwires.net/,https://www.chewelah.k12.wa.us/,https://www.creston.wednet.edu/,https://www.gcdsd.org/,https://www.dallasisd.org/,
     * https://www.banderaisd.net/,https://www.abss.k12.nc.us/ (Blackboard schoolwires)
     *
     * http://www.cabellschools.com/,https://www.asd.wednet.edu/,https://bsd405.org/,http://www.colsd.org/ (SchoolMessenger.com/West Corp)
     *
     * http://www.crb1.net/ (Gaggle)
     *
     * https://www.crb2.org/,https://www.crook1.com/,http://www.fremont14.k12.wy.us/,https://hudsonisd.org/,https://www.zavallaisd.org/,
     * https://www.hollidayisd.net/,https://www.claudeisd.net/,https://medinaisd.org/ (Gabbart)
     *
     * https://www.converse2.org/,https://www.fremont2.org/,http://www.fremont24.com/ (School Webmasters)
     *
     * http://www.landerschools.org/ (infinitecampus.org)
     *
     * http://www.charlotteisd.net/,http://www.jourdantonisd.net/ (SOCS)
     *
     * http://www.boonecountyboe.org/,http://www.eastmont206.org/,http://www.andrews.esc18.net/ (Schoolblocks)
     *
     * http://www.cosmopolisschool.com/pages/Cosmopolis (Edline)
     *
     * http://www.dcschools.us/ (eschoolview)
     *
     * http://claycountyschools.org (wvnet)
     *
     * http://www.boe.faye.k12.wv.us/,http://www.csd49.org/,http://www.frankstonisd.net/ (schoolpointe)
     *
     * https://www.blainesd.org/,http://www.cpps.org/,https://www.daytonsd.org/,http://www.muleshoeisd.net/ (Apptegy)
     *
     * http://www.bickletonschools.org/,http://www.evalinesd.k12.wa.us/ (schoolinsites)
     *
     * https://www.be.wednet.edu/,https://www.eatonville.wednet.edu/,https://www.esd401.org/ (finalsite)
     *
     * http://www.cersd.org/district-information/district-staff-directory,https://www.ferndalesd.org/ (campussuite)
     *
     * http://www.finleysd.org/ (sightworksplatform)
     *
     * https://www.cayugaisd.com/contacts (appspot)
     *
     * http://www.palestineschools.org/,http://www.brazosisd.net/ (eztask)
     *
     * http://www.windthorstisd.net/ (Edclick)
     *
     * http://www.fre6.k12.wy.us/email.html,http://bchs.brax.k12.wv.us/,http://boe.calhoun.k12.wv.us/,http://www.centervilleschool.org
     * http://www.adnaschools.org/,http://www.battlegroundps.org,http://www.colton.k12.wa.us/,http://www.crschools.org,http://www.concrete.k12.wa.us/,
     * http://www.conway.k12.wa.us/,https://dphs.dpsd.org,http://ccps.net,http://ww1.poteetisd.org,https://www.averyschools.net,https://www.beaufort.k12.nc.us/ (none)
     */



    var Schools={};




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
     *
     * convert_ednetworks_email converts
     * emails for the educational networks websites (edlio some places?)
     * input value text comes from either <input type="hidden" name="e" value="([\d]+),?"> or
     * from urls with e=([\d]+)
     *
     *
     */
    Schools.convert_ednetworks_email=function(text)
    {
        var i, split_text=[],ret_text="",dot_char=9999;
        /* Split into 4 character chunks */
        for(i=0; i < text.length; i+=4) split_text.push(text.substr(i,4));
        /** Take the 3rd chunk from right if smaller than 4th (i.e.in case it's .k12.XX.us) **/
        for(i=0; i < split_text.length; i++) dot_char=parseInt(split_text[i])<dot_char ? parseInt(split_text[i]) : dot_char;
        for(i=0; i < split_text.length; i++)
        {
            /* 46 is char code for "." */
            ret_text=ret_text+String.fromCharCode(46+(parseInt(split_text[i])-dot_char)/2);
        }
        return ret_text.replace(/^mailto:/,"");
    };
    /**
     * parse_appsstaff parses the /apps/staff page for an Educational Networks page
     * needs work,
     * in particular it shouldn't do every request in most cases and in fact it's bad to do so because
     * they catch you for scraping
     */
    Schools.parse_appsstaff=function(doc,url,resolve,reject,extra_arg)
    {
        console.log("arguments="+arguments[4]);
        var i,staff_elem=doc.getElementsByClassName("staff-categoryStaffMember"),promise,person;
        for(i=0; i < staff_elem.length; i++)
        {
            console.log("staff_elem[i]="+staff_elem[i].innerHTML);
            var the_url=fix_remote_url(staff_elem[i].getElementsByTagName("a")[0].href,url);
            person=Schools.get_appsstaff_nametitle(staff_elem[i]);
            console.log("the_url["+i+"]="+the_url+", person="+JSON.stringify(person));

            if(the_url.indexOf("&pREC_ID=contact")===-1) the_url=the_url+"&pREC_ID=contact";
            promise=MTurkScript.prototype.create_promise(the_url,Schools.parse_appsstaff_contactpage,
                                                         appsstaff_contactpage_then);
            if(i>0) break;

        }
        resolve("Finished appsstaff");
    };
   
    /* Followup function for appsstaff_contactpage_then, doesn't need to be in original that should be an argument */
    function appsstaff_contactpage_then(result)
    {
        console.log("result for contactpage="+JSON.stringify(result));
    }

    /**
     * parse_appsstaff_contactpage grabs data from a single individual's contact page in
     * create_promise form (incomplete needs work!!!)
     */
    Schools.parse_appsstaff_contactpage=function(doc,url,resolve,reject) {
        var result={name:"",email:"",phone:"",title:""},staffOverview,dl,dt,dd,i,ret;
        var contacts=doc.getElementsByClassName("staffContactWrapper"),phone_match;
        if((staffOverview=doc.getElementsByClassName("staffOverview")).length>0)
        {
            ret=Schools.get_appsstaff_nametitle(staffOverview[0]);
            result.name=ret.name;
            result.title=ret.title;
        }
        for(i=0; i < contacts.length; i++)
        {
            if(phone_match=contacts[i].innerText.match(phone_re)) result.phone=phone_match[0];
        }
        if(doc.getElementsByName("e").length>0)
        {
            result.email=Schools.convert_ednetworks_email(doc.getElementsByName("e")[0].value.replace(/,/g,""));
        }
        resolve(result);
    };
    /* Helper function to get the name and title of a staff member at ednetworks edlio schools on the appsstaff
     * page or the contact page (same format) */
    Schools.get_appsstaff_nametitle=function(div)
    {
        var dl,dt,dd,result={name:"",title:""};
        if((dl=div.getElementsByTagName("dl")).length>0) {
            if((dt=dl[0].getElementsByTagName("dt")).length>0) result.name=dt[0].innerText.trim();
            if((dd=dl[0].getElementsByTagName("dd")).length>0) result.title=dd[0].innerText.trim();
        }
        return result;
    };

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
     * '''do_west_react''' does the react-based West Corporation queries
     * doc is the parsed document from the GM_xmlhttprequest response.responseText,
     * finalUrl is response.finalUrl from same query
     */
    Schools.do_west_react=function(doc,url,resolve,reject,extra_arg)
    {
        var appendElement=extra_arg.append, callback=extra_arg.callback;
        Schools.westSearchTerm=extra_arg.searchTerm;
        url=url.replace(/^(https?:\/\/[^\/]+).*$/,"$1");
        Schools.westBaseUrl=url;
        function increment_scripts()
        {
            console.log("Loaded "+(++Schools.loadedWestScripts)+" out of "+Schools.totalWestScripts+" total scripts");
            if(Schools.loadedWestScripts===Schools.totalWestScripts) Schools.loadWestSettings(callback);
        }
        console.log("Doing react");
        var scripts=doc.scripts,i,div=document.createElement("div"),script_list=[],curr_script;
        Schools.portletInstanceId=doc.getElementsByClassName("staffDirectoryComponent")[0].dataset.portletInstanceId;
        if(appendElement!==undefined) appendElement.appendChild(doc.getElementsByClassName("staffDirectoryComponent")[0]);
        var good_scripts=doc.querySelectorAll("script[id*='ctl']"), head=document.getElementsByTagName("head")[0];
        Schools.totalWestScripts=good_scripts.length;
        Schools.loadedWestScripts=0;
        for(i=0; i<good_scripts.length; i++)
        {
            curr_script=document.createElement("script");
            curr_script.src=good_scripts[i].src;
            console.log("curr_script.src="+curr_script.src);
            curr_script.onload=increment_scripts;
            script_list.push(curr_script);
            head.appendChild(curr_script);
        }

     
    };
    /* Loads the settings, namely the groupIds which is all we need */
    Schools.loadWestSettings=function(callback)
    {
        var json={"portletInstanceId":Schools.portletInstanceId};
        Schools.loadWestReact("Settings",json,function(response) {
            var r_json=JSON.parse(response.responseText),i;
            Schools.westGroupIds=[];
            for(i=0; i < r_json.d.groups.length; i++) Schools.westGroupIds.push(r_json.d.groups[i].groupID);
            Schools.loadWestSearch(callback);
        });
    }

    /**
     * '''loadWestSearch''' loads the West Corporation style search query for the job title set by
     * my_query.job_title r loads the first 20 alphabetically otherwise if my_query.job_title isn't set
     *
     * Letting json_response=JSON.parse(response.responseText), json_response.d.results should have a
     * list of objects of the results to the query, with
     * fields email, firstName, lastName,jobTitle,phone,website,imageURL,userID
     *
     *
     */

    Schools.loadWestSearch=function(callback)
    {
        var json={"firstRecord":0,"groupIds":Schools.westGroupIds,"lastRecord":39,
                 "portletInstanceId":Schools.portletInstanceId,
                 "searchTerm":Schools.westSearchTerm,"sortOrder":"LastName,FirstName ASC","searchByJobTitle":true};
        if(Schools.westSearchTerm===undefined) { json.searchTerm=""; json.searchByJobTitle=false; }
        Schools.loadWestReact("Search",json,callback);
    };

    /**
     * '''loadWestReact''' does a GM_xmlhttprequest query of the StaffDirectory at the my_query.staff_path in question
     *
     * (my_query.staff_path to be found by searching e.g. Bing, and should be the part found by /https?:\/\/[^\/]+/
     * type is the type of query to get ("Settings" or "Search"), url is the what's the fucking word for beginning of path
     * url of the website
     * json is the json to send with it since it's a POST request
     * callback is the callback
     */
    Schools.loadWestReact=function(type,json,callback)
    {
        var url=Schools.westBaseUrl+"/Common/controls/StaffDirectory/ws/StaffDirectoryWS.asmx/"+type;
        console.log("url="+url);
        var headers={"Content-Type":"application/json;charset=UTF-8"};
        GM_xmlhttpRequest({method: 'POST', url: url, headers:headers, data:JSON.stringify(json),
            onload: function(response) {
                if(type==="Search") { Schools.parseWestSearch(response,callback); }
                else { callback(response); }
            },
            onerror: function(response) { console.log("Fail"); },
            ontimeout: function(response) { console.log("Fail"); }
            });
    };

    /**
     * parse_west_search is called after the initial search query with the response,
     * searches to see if there are any private emails, then grabs them
     * with another loophole
     */
    Schools.parseWestSearch=function(response,callback)
    {
        var search=JSON.parse(response.responseText);
        var results=search.d.results,i,url;
        Schools.westResults=results;Schools.westPrivateCount=0;Schools.westPrivateDone=0;
        var promise_list=[];
        for(i=0; i < results.length; i++)
        {
            console.log("("+i+"), "+JSON.stringify(results[i]));
            if(results[i].email==="private")
            {
                Schools.westPrivateCount++;
                url=Schools.westBaseUrl+"/common/controls/General/Email/Default.aspx?action=staffDirectoryEmail&"+
                    "recipients="+results[i].userID;
                console.log("private email url="+url);
                promise_list.push(MTurkScript.prototype.create_promise(url,Schools.getWestPrivateEmail,callback,MTurkScript.prototype.my_catch_func,i));
            }
            else
            {
                console.log("results["+i+"].email="+results[i].email);
            }
//            console.log("Email for "+i+"="+results[i].email);
        }
        //console.log("search="+text);
    };
    /**
     * getWestPrivateEmail uses another avenue to find the emails they tried to keep private
     * it resolves on the original callback to the West thing once all the private emails have been grabbed
     * probably a clunky way to do it but it's working and should be self contained
     */
    Schools.getWestPrivateEmail=function(doc,url,resolve,reject,i)
    {
        console.log("url="+url);
        var headers={"Content-Type":"application/json;charset=UTF-8"};
        Schools.westResults[i].email=doc.getElementById("ctl00_ContentPlaceHolder1_ctl00_txtTo").value;
        Schools.westPrivateDone++;
        console.log("Done "+Schools.westPrivateDone+" private emails");
        if(Schools.westPrivateCount===Schools.westPrivateDone)
        {
            resolve(i);
        }

    };

/* TODO:    Work Force v3.3.2 by The Thinkery LLC. http://thethinkery.net
Example at http://www.svalley.k12.in.us/contact/new-jr-sr-high-school-faculty

*/

    /* Creates a promise where it does a standard GM_xmlhttpRequest GET thing, on which point it
    does the DOMParser thing, loads the parser taking (doc,url,resolve,reject)

       and the promise does (mandatory) then_func on resolving, (optional, otherwise just prints a message) catch_func on
       rejecting
    */
    function create_promise(url, parser, then_func,catch_func,extra_arg)
    {
        if(catch_func===undefined) catch_func=function(response) { console.log("Request to url failed "+response); };

        const queryPromise = new Promise((resolve, reject) => {
            GM_xmlhttpRequest(
                {method: 'GET', url: url,
                 onload: function(response) {
                     var doc = new DOMParser()
                     .parseFromString(response.responseText, "text/html");
                     if(extra_arg!==undefined) parser(doc,response.finalUrl, resolve, reject,extra_arg);
                     else parser(doc,response.finalUrl, resolve, reject);
                 },
                 onerror: function(response) { reject("Failed to load site "+response); },
                 ontimeout: function(response) {reject("Timed out loading site "+response); }
                });
        });
        queryPromise.then(then_func)
            .catch(catch_func);
        return queryPromise;
    }

    var my_catch_func=function(response) { console.log("Request to url failed "); };
   

    function parse_promise_then(result)
    {
        console.log("parse_promise_then: result="+JSON.stringify(result));
    }



    function init_Query()
    {
//        var dont=document.getElementsByClassName("dont-break-out")[0].href;
  //      var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
    
        var url="https://swanscreekes.pwcs.edu/staff_directory";
           my_query={loadedScripts:0,totalScripts:0,url:url,job_title:"principal"};
        my_query.staff_path=url.match(/^https?:\/\/[^\/]+/)[0];
        var appendElement=document.getElementsByTagName("p")[0];
       /* GM_xmlhttpRequest({method: 'GET', url: url,
            onload: function(response) { find_emails(response,appendElement); },
            onerror: function(response) { console.log("Fail"); },
            ontimeout: function(response) { console.log("Fail"); }
            });*/

        var fb_url="https://www.facebook.com/pg/holyfamilyparishpueblo/about/?ref=page_internal";
        var fb_search_url="https://www.facebook.com/oregoncountysheriff/?ref=br_rs";
        var ednet_url="https://www.clintoncentral.org/apps/staff/";
        var west_url="http://www.eastnoble.net/staff_directory";
        var promise_list=[];
      //  promise_list.push(MTurkScript.prototype.create_promise(ednet_url,parse_appsstaff,parse_promise_then,MTurkScript.prototype.my_catch_func,"fuck"));
         promise_list.push(
             MTurkScript.prototype.create_promise(west_url,Schools.do_west_react,parse_promise_then,MTurkScript.prototype.my_catch_func,
                                                  {append:appendElement,searchTerm:"Principal",callback:function(i)
                                                   { console.log("i="+i);
                                                    console.log("result="+JSON.stringify(Schools.westResults));

                                                   }}));
      





    }
    if(window.location.href.indexOf("trystuff.com")!==-1)
    {
        init_Query();
    }



})();
