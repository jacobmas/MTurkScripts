    var Schools={contact_list:[],
                page_regex_str:"apptegy\\.com|catapultk12\\.com|cms4schools\\.com|crescerance\\.com|cyberschool\\.com|"+
            "echalk\\.com|edlio\\.com|edlioschool\\.com|edline\\.net|educationalnetworks\\.net|"+
            "eschoolview\\.com|finalsite\\.com|foxbright\\.com|gabbart\\.com|gaggle\\.net|ilearnschools\\.org|"+
            "schoolblocks\\.com|schooldesk\\.net|www\\.schoolinsites\\.com|schoolloop\\.com|www\\.schoolmessenger\\.com|"+
            "schoolpointe\\.com|schoolwebmasters\\.com|socs\\.fes\\.org|www\\.zumu\\.com",
                 script_regex_lst:[{regex:/apptegy_cms\//,name:"apptegy"}]

                };
    /* Schools.matches_name checks if a given name matches the desired school's name */
    Schools.matches_name=function(name) {
        var the_regex=/(\s)School.*$/;
        var short_school=Schools.name.replace(the_regex,"").toLowerCase();
        var short_name=name.replace(the_regex,"").toLowerCase();
        if(short_name.indexOf(short_school)!==-1 || short_school.indexOf(short_name)!==-1) return true;
        return false;
    };
    /* Schools.match_in_list matches the schools name in a list */
    Schools.match_in_list=function(ul,url) {
        var i,children=ul.children,inner_a;
        for(i=0; i < children.length; i++) {
            if(Schools.matches_name(children[i].innerText) &&
               (inner_a=children[i].getElementsByTagName("a")).length>0) return MTurkScript.prototype.fix_remote_url(inner_a[0].href,url);
        }
        return null;

    };

    /* Schools.parse_apptegy parses the (base/staff) page for apptegy sites

    Need to fix instances where it's an individual school e.g. https://www.cfschools.net/o/central-falls-high-school/staff
    */
    Schools.parse_apptegy=function(doc,url,resolve,reject,extra) {
         console.log("in Schools.parse_apptegy at url="+url);
         doc.querySelectorAll(".contact-info").forEach(Schools.parse_apptegy_field);
         console.log("Schools.contact_list="+JSON.stringify(Schools.contact_list));
    };
    /* Helper to parse an individual person for Schools.parse_apptegy */
    Schools.parse_apptegy_field=function(elem) {
        var field_names={"name":"name","title":"title","phone-number":"phone","department":"department","email":"email"};
        var curr_contact={},x,curr_field;
        for(x in field_names) {
            if((curr_field=elem.getElementsByClassName(x)).length>0) curr_contact[field_names[x]]=curr_field[0].innerText.trim();
        }
        if(curr_contact.title && Schools.matches_title_regex(curr_contact.title)) Schools.contact_list.push(curr_contact);
    };
    /* Schools.matches_title_regex is a function to check if a title matches something in
    * the query in Schools.title_regex */
    Schools.matches_title_regex=function(title) {
        for(var i=0; i < Schools.title_regex.length; i++) if(title.match(Schools.title_regex[i])) return true;
        return false;
    };

    Schools.find_base_apptegy=function(doc,url) {
        var i,h4,cols=doc.getElementsByClassName("footer-col"),list,ret;
        for(i=0; i < cols.length; i++) {
            if((h4=cols[i].getElementsByTagName("h4")).length>0 && /Schools/i.test(h4[0].innerText)
                   && (list=cols[i].getElementsByClassName("footer-links")).length>0 &&
              (ret=Schools.match_in_list(list[0],url))) return ret;
        }
        return url.replace(/(https?:\/\/[^\/]+).*$/,"$1");
    };



    Schools.parse_apptegy_then=function(result) {
    };
    /* Schools elements for CMS types: parser is a function to parse when they're on the directory page already.
       find_base is a function to find the url base for a specific school (if necessary for directory-finding), returning
       canonical base for the url if nothing else found for the given name
       suffix is the suffix to add to the found base to call the parser if immediate_parse is true */
    Schools.apptegy={parser:Schools.parse_apptegy,suffix:"/staff",then:Schools.parse_apptegy_then,immediate_parse:true,
                    find_base:Schools.find_base_apptegy};




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
    Schools.do_west_react=function(doc,url,resolve,reject,extra_arg) {
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
    Schools.loadWestSettings=function(callback) {
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

    Schools.loadWestSearch=function(callback) {
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

    /* Starter code for gabbard search */
    Schools.parse_gabbard=function(doc,url,resolve,reject) {

        //https://www.usd377.org/includes/actions/search.php?term=principal&id=357&from=0&to=10
        //https://www.usd257.org/includes/actions/search.php?term=principal&id=538%2C539%2C540%2C541%2C542%2C543%2C537&from=0&to=10
        //<script>window.search_site = '538,539,540,541,542,543,537';</script> (right below the #search_field element on https://www.usd257.org/search_e)
    };


    /* Initialize Schools, a create_promise style function
     * with extra arg title_list a list of titles of entities to grab into contact_list
     * TODO: something about finding the school website given district website (often easier to find),
     * highly incomplete
     */
    Schools.init_Schools=function(doc,url,resolve,reject,title_list)
    {
        Schools.doc=doc;
        Schools.url=url;
        Schools.resolve=resolve;
        Schools.reject=reject;
        Schools.title_list=title_list;

    };
    /**  Schools.init_search Initializes Schools search, a create_promise style function
     * input page should've been identified already as the directory page
     */
    Schools.init_Search=function(doc,url,resolve,reject) { };

    /** Schools.init_School initializes the Schools create_promise thing
     * query: {type: string, name:string,title_regex:[]} will be an object where type is either district or school
     * and TODO: name is a name of school or blank depending on whether we got sent a url or not as initial data
     * for now deal with name as name, title_regex is a list of titles
     */
    Schools.init_School=function(doc,url,resolve,reject,query) {
        var curr_school;
        console.log("Schools.init_School, url="+url+", query="+JSON.stringify(query));
        Schools.resolve=resolve;Schools.reject=reject;Schools.type=query.type;Schools.name=query.name;
        Schools.title_regex=query.title_regex;
        Schools.page_type=Schools.id_page_type(doc,url,resolve,reject,query);
        console.log("page_type="+Schools.page_type);
        if((curr_school=Schools[Schools.page_type])&&curr_school.find_base&&Schools.type==="school") {
            console.log("immediate parse time "+JSON.stringify(Schools[Schools.page_type]));
            var base=curr_school.find_base(doc,url);
            console.log("base="+base);
            var promise=MTurkScript.prototype.create_promise(base+
                                                             Schools[Schools.page_type].suffix,Schools[Schools.page_type].parser,
                                                             Schools[Schools.page_type].then);
        }
    };


    /**
     * Schools.id_page_type identifies the CMS/etc for the school website
     */
    Schools.id_page_type=function(doc,url,resolve,reject,query) {
        var page_type="none",i,match,copyright,sites_google_found=false,generator,gen_content;
        var page_type_regex2=/Apptegy/,copyright_regex=/Blackboard, Inc/,page_type_regex=new RegExp(Schools.page_regex_str,"i");
        for(i=0; i < (generator=doc.getElementsByName("generator")).length; i++) console.log("generator="+(generator[i].content));
        for(i=0; i < doc.links.length; i++) {
            if((match=doc.links[i].href.match(page_type_regex)) || (match=doc.links[i].innerText.match(page_type_regex2))) {
                page_type=match[0].replace(/\.[^\.]*$/,"").toLowerCase().replace(/www\./,"").replace(/\./g,"_");
                break; }
            else if(/sites\.google\.com/.test(doc.links[i].href)
                    && /Google Sites/i.test(doc.links[i].innerText)) sites_google_found=true;
        }
        doc.querySelectorAll("footer").forEach(function(footer) {
            if(footer.dataset.createSiteUrl&&/sites\.google\.com/.test(footer.dataset.createSiteUrl)) sites_google_found=true; });
        if(page_type==="none" && doc.getElementById("sw-footer-copyright")) page_type="blackboard";
        else if(page_type==="none"&& sites_google_found) page_type="sites_google";
        if(page_type==="none") {
            doc.querySelectorAll("script").forEach(function(curr_script) {
            for(i=0; i < Schools.script_regex_lst.length;i++) {
                if(curr_script.src&&
                   Schools.script_regex_lst[i].regex.test(curr_script.src)) page_type=Schools.script_regex_lst[i].name;
                else if(curr_script.innerHTML.indexOf("_W.configDomain = \"www.weebly.com\"")!==-1) console.log("generator=weebly.com");
            }
            });
        }
        return page_type;
    };


/* TODO:    Work Force v3.3.2 by The Thinkery LLC. http://thethinkery.net
Example at http://www.svalley.k12.in.us/contact/new-jr-sr-high-school-faculty

*/

 
Schools.parse_promise_then=function(result)
{
    console.log("parse_promise_then: result="+JSON.stringify(result));
};
