    var Schools={contact_list:[],
             page_regex_str:"(www\\.|\/\/)(apptegy|catapultk12|cms4schools)\\.com|crescerance\\.com|cyberschool\\.com|"+
             "echalk\\.com|edlio\\.com|edlioschool\\.com|edline\\.net|educationalnetworks\\.net|"+
             "eschoolview\\.com|finalsite\\.com|foxbright\\.com|gabbart\\.com|gaggle\\.net|ilearnschools\\.org|"+
             "schooldesk\\.net|schoolloop\\.com|"+
	     "www\\.school(blocks|insites|messenger|pointe|webmasters)\\.com|"+
             "socs\\.fes\\.org|www\\.zumu\\.com",
             script_regex_lst:[{regex:/apptegy_cms\//,name:"apptegy"}],
                 split_lines_regex:/\s*\n\s*|\s*\t\s*|–|(\s+-\s+)|\||                     |	|	|●|•|\s{3,}|\s+\*\s+/,
		 AL:{},AK:{},AZ:{},AR:{},CA:{},CO:{},CT:{},DE:{},DC:{},FL:{},GA:{},HI:{},ID:{},IL:{},IN:{},IA:{},KS:{},KY:{},LA:{},
		 ME:{},MD:{},MA:{},MI:{},MN:{},MS:{},MO:{},MT:{},NE:{},NV:{},NH:{},NJ:{},NM:{},NY:{},NC:{},ND:{},OH:{},OK:{},OR:{},
		 PA:{},RI:{},SC:{},SD:{},TN:{},TX:{},UT:{},VT:{},VA:{},WA:{},WV:{},WI:{},WY:{}
		};
    /* Schools.parse_name_func parses the name partially for a school person, primarily as a helper for parse_data_func */
    Schools.parse_name_func=function(text) {
        var split_str,fname,lname,i;
        var appell=[/^Mr\.\s*/,/^Mrs\.\s*/,/^Ms\.\s*/,/^Miss\s*/,/^Dr\.\s*/],suffix=[/,?\s*Jr\.?/];
        for(i=0; i < appell.length; i++) text=text.replace(appell[i],"");
        if(/[a-z]{2,}/.test(text)) {
            text=text.replace(/(,?\s*[A-Z]+)$/,""); }
        for(i=0; i < suffix.length; i++) text=text.replace(suffix[i],"");
        return text.replace(/^([^,]+),\s*(.*)$/,"$2 $1");
    };
    /* Schools.parse_data_func parses text for a school person */
    Schools.parse_data_func=function(text) {
        var ret={},fname="",lname="",i=0,j=0, k=0,curr_line, s_part="", second_arr,begin_name;
        var has_pasted_title=false,good_stuff_re=/[A-Za-z0-9]/,split_comma,curr_last;
        if((text=text.trim()).length===0) return ret;
        var split_lines_1=(text=text.trim()).split(Schools.split_lines_regex),split_lines=[],temp_split_lines,new_split,found_email=false;
        if(/^[^\s]+\s+[^\s]+,\s*[A-Z\.]*[^A-Z\s\n,]+/.test(split_lines_1[0])) {
            split_lines=split_lines_1[0].split(",").concat(split_lines_1.slice(1)); }
        else split_lines=split_lines_1;
        if(/:/.test(split_lines[0])) split_lines=split_lines[0].split(":").concat(split_lines.slice(1));
        split_lines=split_lines.filter(line => line);
        /** Additional code **/
        if(/Director|Principal|Teacher/.test(split_lines[0]) &&
          (temp_split_lines=split_lines.splice(0,1))) split_lines.splice(1,0,temp_split_lines[0]);
        /** End additional code **/
        if(split_lines===null) return;
        for(j=0; j < split_lines.length; j++) {
            if(split_lines.length>0 && split_lines[j] && split_lines[j].trim().length > 0
               && good_stuff_re.test(split_lines[j])) break; }
        if(j>=split_lines.length) return ret;
        if((split_comma=split_lines[j].split(/,/)).length===2 && /[^\s]\s/.test(split_comma[0])) {
            console.log("Doing split_comma");
            split_lines.push(split_lines[(curr_last=split_lines.length-1)]);
            for(k=curr_last; k>=j+2; k--) split_lines[k]=split_lines[k-1];
            split_lines[j]=split_comma[0];
            split_lines[j+1]=split_comma[1];
        }
        if(split_lines.length>0 && j<split_lines.length &&
           split_lines[j] && split_lines[j].trim().length > 0) ret.name=Schools.parse_name_func(split_lines[j].trim());
        for(i=j+1; i < split_lines.length; i++) {
            found_email=false;
            if(split_lines[i]===undefined || !good_stuff_re.test(split_lines[i])) continue;
              if(/:$/.test(split_lines[i].trim())) continue;
            second_arr=(curr_line=split_lines[i].trim()).split(/:\s+/);
            if(/Title:/.test(curr_line) && (ret.title=curr_line.replace(/.*Title:\s*/,"").trim())) continue;
            if((s_part=second_arr[second_arr.length-1].trim()) && email_re.test(s_part) && (found_email=true)) ret.email=s_part.match(email_re)[0];
            else if(phone_re.test(s_part)) ret.phone=s_part.match(phone_re)[0];
            else if(s_part.length>10 && s_part.substr(0,10)==="Phone Icon" &&
                    phone_re.test(s_part.substr(11))) ret.phone=s_part.substr(11).match(phone_re)[0];
            else if((s_part.trim().length>0  && !has_pasted_title) || s_part.indexOf("Title:")!==-1) {
                if(/^ext/.test(s_part)) ret.phone=(ret.phone+" "+s_part.trim()).trim();
                else if(has_pasted_title=true) ret.title=s_part.replace(/^Title:/,"").trim(); }
        }
        return ret;
    };
    /* Schools.matches_name checks if a given name matches the desired school's name */
    Schools.matches_name=function(name) {
        var the_regex=/(\s)School.*$/;
        var short_school=Schools.name.replace(the_regex,"").toLowerCase();
        var short_name=name.replace(the_regex,"").toLowerCase();
        if(short_name.indexOf(short_school)!==-1 || short_school.indexOf(short_name)!==-1) return true;
        return false;
    };
    /* Note: Matches undefined cities too
    TODO: Deal with Mount/Mt. Saint/St. etc shit
    */
    Schools.matches_city=function(city) {
        if(Schools.city===undefined || Schools.city===null) return true;
        var short_mycity=Schools.city.toLowerCase().trim(),short_city=city.toLowerCase().trim();
        //console.log("short_mycity="+short_mycity+", short_city="+short_city);
        return short_mycity===short_city;
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
    */
    Schools.parse_apptegy=function(doc,url,resolve,reject,extra) {
        console.log("in Schools.parse_apptegy at url="+url);
        doc.querySelectorAll(".contact-info").forEach(Schools.parse_apptegy_field);
        resolve(Schools.contact_list);
    };
    /* Helper to parse an individual person for Schools.parse_apptegy */
    Schools.parse_apptegy_field=function(elem) {
        var f_n={"name":"name","title":"title","phone-number":"phone","department":"department","email":"email"};
        var curr_c={},x,curr_f;
        for(x in f_n) if((curr_f=elem.getElementsByClassName(x)).length>0) curr_c[f_n[x]]=curr_f[0].innerText.trim();
        if(curr_c.title && Schools.matches_title_regex(curr_c.title)) Schools.contact_list.push(curr_c);
    };
    /* Schools.matches_title_regex is a function to check if a title matches something in
    * the query in Schools.title_regex */
    Schools.matches_title_regex=function(title) {
        for(var i=0; i < Schools.title_regex.length; i++) if(title.match(Schools.title_regex[i])) return true;
        return false;
    };
    /* Schools.find_base_apptegy finds the url base for a specific school for apptegy */
    Schools.find_base_apptegy=function(doc,url) {
        var i,h4,cols=doc.getElementsByClassName("footer-col"),list,ret;
        for(i=0; i < cols.length; i++) {
            if((h4=cols[i].getElementsByTagName("h4")).length>0 && /Schools/i.test(h4[0].innerText)
                   && (list=cols[i].getElementsByClassName("footer-links")).length>0 &&
              (ret=Schools.match_in_list(list[0],url))) return ret;
        }
        return url.replace(/(https?:\/\/[^\/]+).*$/,"$1");
    };
    /* Find the staff directory in a systematic way, curr_type is the type of page being done */
    Schools.find_dir=function(doc,url,resolve,reject,curr_type) {
        var links=doc.links,i;
        for(i=0;i<links.length;i++) {
            links[i].href=MTP.fix_remote_url(links[i].href,url);
            if(curr_type.href_rx.test(links[i].href) &&
               curr_type.text_rx.test(links[i].innerText) && (resolve(links[i].href))) return;
        }
        resolve(url);
    };
    Schools.parse_catapultk12=function(doc,url,resolve,reject) {
        var i,scripts=doc.scripts;
        function padStr(i) { return (i < 10) ? "0" + i : "" + i; }
        function printDate() {
            var t = new Date();
            return padStr(t.getFullYear())+padStr(1+t.getMonth())+padStr(t.getDate())+
                padStr(t.getHours())+padStr(t.getMinutes())+padStr(t.getSeconds());
        }
        console.log("In parse_catapultk12 at "+url);
        var token,t_match,t_reg=/\'AuthorizationToken\':\s*\'([^\']+)\'/;
        var prog_url,p_match,p_reg=/\'ProgramUrl\':\s*'([^\']+)\'/;
        for(i=0;i<scripts.length;i++) {
            if(/^\s*CatapultSD/.test(scripts[i].innerHTML)) {
                console.log("scripts["+i+"].innerHTML="+scripts[i].innerHTML);
                if((p_match=scripts[i].innerHTML.match(p_reg)) && (prog_url=p_match[1]) &&
                    (t_match=scripts[i].innerHTML.match(t_reg)) && (token=t_match[1])) break;
            }
        }
        if(token && prog_url) { console.log("token="+token); console.log("prog_url="+prog_url); }
        var full_url=prog_url+"/Connector/StaffList/All/LastName/All/false/NotSet?"+printDate()+"&{}";
        var headers={'Content-Type':'application/json; charset=utf-8','CatapultSDAuthToken':token};
        GM_xmlhttpRequest({method: 'GET', url: full_url,headers:headers,
                           onload: function(response) { Schools.parse_catapultk12_finish(response, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }});

    };
    /* Schools.parse_catapultk12_finish is a JSON list */
    Schools.parse_catapultk12_finish=function(response,resolve,reject) {
        var result=[],i,curr_field,sites;
        try {
            Schools.contact_list=JSON.parse(response.responseText); }
        catch(error) { console.log("Error parsing catapultk12, "+error); reject(""); return; }
        for(i=0;i<Schools.contact_list.length;i++) {
            if(Schools.contact_list[i].StaffSites===undefined || Schools.contact_list[i].StaffSites.length===0) continue;
            else sites=Schools.contact_list[i].StaffSites[0];
            curr_field={first:Schools.contact_list[i].FirstName,last:Schools.contact_list[i].LastName,
                        name:Schools.contact_list[i].FirstName+" "+Schools.contact_list[i].LastName,
                        title:sites.Position,phone:sites.SitePhoneNumber+(sites.PhoneExt && sites.PhoneExt.length>0 ? ' x'+sites.PhoneExt : ''),
                        email:Schools.contact_list[i].Email,department:sites.department,school:sites.SiteName};
            if(Schools.matches_title_regex(curr_field.title) &&
               (Schools.matches_name(curr_field.school) || /District/.test(curr_field.school))) result.push(curr_field);
        }
        resolve(result);
    };
    Schools.parse_apptegy_then=function(result) {
    };
    /* Schools elements for CMS types: parser is a function to parse when they're on the directory page already.
       find_base is a function to find the url base for a specific school (if necessary for directory-finding), returning
       canonical base for the url if nothing else found for the given name
       suffix is the suffix to add to the found base to call the parser if immediate_parse is true */
    Schools.apptegy={parser:Schools.parse_apptegy,suffix:"/staff",then:Schools.parse_apptegy_then,immediate_parse:true,
                    find_base:Schools.find_base_apptegy};
    Schools.catapultk12={parser:Schools.parse_catapultk12,find_directory:Schools.find_dir,href_rx:/\/Staff-Directory/,text_rx:/Directory/i};

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

    function find_emails(response,appendElement) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var i,j,email_val,my_match,email_list=[],principal_url="",contact_url="",directory_url="";
        if(try_specific(doc,response.finalUrl,appendElement)) return;
        console.log("in contact response "+response.finalUrl);
        for(i=0; i < email_list.length; i++) console.log("email_list["+i+"]="+email_list[i]);
        if(++my_query.try_count>4) return;
        var begin_url=response.finalUrl.replace(/(https:\/\/[^\/]+)\/.*$/,"$1");
    }
    Schools.convert_cyberschools_email=function(text) {
        var split_text=[],i,ret="";
        /* map to correct character */
        function get_value(char) {
            if(/^[A-Z]+/.test(char)) return (char.charCodeAt(0)-65);
            else if(/^[a-z]+/.test(char)) return (26+char.charCodeAt(0)-97);
            else if(/^[0-9]+/.test(char)) return (52+char.charCodeAt(0)-48);
            else {
                console.log("Got a non-alphanumeric character"); return -1; }
        }

        /* get the first character */
        function get_first(text) { return text.length>=2 ? String.fromCharCode(get_value(text.charAt(0))*4+get_value(text.charAt(1))/16) : ""; }
        function get_second(text) { return text.length>=3 ? String.fromCharCode((get_value(text.charAt(1))%16)*16+get_value(text.charAt(2))/4) : ""; }
        function get_third(text) { return text.length>=4 ? String.fromCharCode((get_value(text.charAt(2))%4)*64+get_value(text.charAt(3))): ""; }
        for(i=0;i<text.length;i+=4) split_text.push(text.substr(i,4));
        for(i=0;i<split_text.length; i++) {
            split_text[i]=split_text[i].replace(/\=/g,"");
            ret=ret+get_first(split_text[i])+get_second(split_text[i])+get_third(split_text[i]);
        }
        return ret;

    };

    /**
     *
     * convert_ednetworks_email converts
     * emails for the educational networks websites (edlio some places?)
     * input value text comes from either <input type="hidden" name="e" value="([\d]+),?"> or
     * from urls with e=([\d]+)
     *
     *
     */
    Schools.convert_ednetworks_email=function(text) {
        var i, split_text=[],ret_text="",dot_char=9999;
        /* Split into 4 character chunks */
        for(i=0; i < text.length; i+=4) split_text.push(text.substr(i,4));
        /** Take the 3rd chunk from right if smaller than 4th (i.e.in case it's .k12.XX.us) **/
        for(i=0; i < split_text.length; i++) dot_char=parseInt(split_text[i])<dot_char ? parseInt(split_text[i]) : dot_char;
        /* 46 is char code for "." */
        for(i=0; i < split_text.length; i++) ret_text=ret_text+String.fromCharCode(46+(parseInt(split_text[i])-dot_char)/2);
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
        for(i=0; i < staff_elem.length; i++) {
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
    function appsstaff_contactpage_then(result) {
        console.log("result for contactpage="+JSON.stringify(result));
    }

    /**
     * parse_appsstaff_contactpage grabs data from a single individual's contact page in
     * create_promise form (incomplete needs work!!!)
     */
    Schools.parse_appsstaff_contactpage=function(doc,url,resolve,reject) {
        var result={name:"",email:"",phone:"",title:""},staffOverview,dl,dt,dd,i,ret;
        var contacts=doc.getElementsByClassName("staffContactWrapper"),phone_match;
        if((staffOverview=doc.getElementsByClassName("staffOverview")).length>0) {
            ret=Schools.get_appsstaff_nametitle(staffOverview[0]);
            result.name=ret.name;
            result.title=ret.title;
        }
        for(i=0; i < contacts.length; i++) if(phone_match=contacts[i].innerText.match(phone_re)) result.phone=phone_match[0];
        if(doc.getElementsByName("e").length>0) result.email=Schools.convert_ednetworks_email(doc.getElementsByName("e")[0].value.replace(/,/g,""));
        resolve(result);
    };
    /* Helper function to get the name and title of a staff member at ednetworks edlio schools on the appsstaff
     * page or the contact page (same format) */
    Schools.get_appsstaff_nametitle=function(div) {
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
    function try_specific(doc,finalUrl,appendElement) {
        var scripts=doc.scripts,i;
        var bbbutt=doc.getElementsByClassName("bb-butt");
        var staffDirectory=doc.getElementsByClassName("staffDirectoryComponent");
        if(bbbutt.length>0) {
            console.log("Found blackboard");
            do_blackboard(doc,finalUrl,appendElement);
            return true;
        }
        else if(staffDirectory.length>0) {
            console.log("Found react");
            do_react(doc,finalUrl,appendElement);
            return true;
        }
        return false;
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
        function increment_scripts() {
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
        for(i=0; i<good_scripts.length; i++) {
            (curr_script=document.createElement("script")).src=good_scripts[i].src;
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


    /* Schools.call_parser is a helper function to create a promise for the school parser */
    Schools.call_parser=function(url) {
        var promise=MTP.create_promise(url,Schools.curr_school.parser,Schools.resolve,Schools.reject);
    };

    /** Schools.init_SchoolSearch initializes the School search create_promise thing given we've gotten a url already
     * query: {type: string, name:string,title_regex:[]} will be an object where type is either district or school
     * and TODO: name is a name of school or blank depending on whether we got sent a url or not as initial data
     * for now deal with name as name, title_regex is a list of titles
     */
    Schools.init_SchoolSearch=function(doc,url,resolve,reject,query) {
        var curr_school,base=url.replace(/\$/,""),promise,parse_url;
        console.log("Schools.init_SchoolSearch, url="+url+", query="+JSON.stringify(query));
        Schools.resolve=resolve;Schools.reject=reject;Schools.type=query.type;Schools.name=query.name;
        Schools.title_regex=query.title_regex;
        Schools.page_type=Schools.id_page_type(doc,url,resolve,reject,query);
        Schools.curr_school=Schools[Schools.page_type];
        console.log("page_type="+Schools.page_type);

        /* If  */
        if((curr_school=Schools[Schools.page_type])&&curr_school.find_base&&Schools.type==="school") {
            console.log("searching for base "+JSON.stringify(Schools[Schools.page_type]));
            base=curr_school.find_base(doc,url); }
        /* if suffix we can immediately head to the directory parser */
        if(curr_school && curr_school.suffix) {
            console.log("# heading immediately to directory");
            Schools.call_parser(base+curr_school.suffix); }
        else if(curr_school && curr_school.find_directory) {
            console.log("# Finding directory");
            promise=MTP.create_promise(base,curr_school.find_directory,Schools.call_parser,MTP.my_catch_func,curr_school);
        }
        else if(!curr_school) { console.log("School page_type not defined parsing yet"); }
        else { console.log("Weird shouldn't be here"); }
    };
    /** Schools.init_Schools initializes schools
     query: {type: string, name:string,title_regex:[],url:url,state_dir:boolean,addressLine1,city,state,zip}
     will be an object where type is either district or school
     name is a name of school or blank, and url is either a url or empty (url and name should never BOTH be empty),
     state_dir is whether to try our luck with the state directory only
     addressLine1,city,state,zip are as usual
     returns a promise (can be "then'd" on the client side)
    */
    Schools.init_Schools=function(query) {
        Schools.type=query.type;Schools.name=query.name;Schools.title_regex=query.title_regex;Schools.state_dir=query.state_dir;
        Schools.addressLine1=query.addressLine1;Schools.city=query.city;Schools.state=query.state;
        const schoolPromise=new Promise((resolve,reject) => {
            if(Schools.state_dir) Schools[Schools.state].get_state_dir(resolve,reject);
        });
        return schoolPromise;
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


    /* Probably should change to have a specific function for the script using the School thing */
    Schools.parse_promise_then=function(result) {
        console.log("parse_promise_then: result="+JSON.stringify(result));
    }
Schools.AK.get_state_dir=function(resolve,reject) {
    var url="https://education.alaska.gov/DOE_Rolodex/SchoolCalendar/Home/Search?term="+Schools.name.replace(/\s/g,"+");
    var promise=MTP.create_promise(url,Schools.AK.get_school_search,resolve,reject);
};
Schools.AK.get_school_search=function(doc,url,resolve,reject) {
    var table=doc.getElementById("myTable"),i,row,next_url="",url_lst,promise;
    if(/\/SchoolDetails\//.test(url) && Schools.AK.parse_school_details(doc,url,resolve,reject)) return true;
    for(i=0;i<table.rows.length;i++) {
        if((row=table.rows[i])&&row.cells.length>=2 && /School/.test(row.cells[1].innerText) &&
           Schools.matches_name(row.cells[0].innerText.trim()) && (url_lst=row.cells[0].getElementsByTagName("a")).length>0
           && (next_url=MTP.fix_remote_url(url_lst[0].href,url))) break;
    }
    if(next_url.length>0) promise=MTP.create_promise(next_url,Schools.AK.parse_school_details,resolve,reject);
    else resolve("");
    return true;

};
Schools.AK.parse_school_details=function(doc,url,resolve,reject) {
    var lst=doc.getElementsByClassName("list-value")[0].children,i,label,value,x,curr_contact={},web,split_text;
    var match_map={"address":/^Physical Address/,"phone":/^Telephone/,"low":/^Lowest Grade/,"high":/^Highest Grade/};
    for(i=0;i<lst.length;i++) {
        label=lst[i].getElementsByTagName("h3");
        value=lst[i].getElementsByTagName("div");
        if(label.length===0 || value.length===0) continue;
        for(x in match_map) if(match_map[x].test(label[0].innerText)) curr_contact[x]=value[0].innerText.trim();
        if(/School Website/.test(label[0].innerText)&&
           (web=value[0].getElementsByTagName("a")).length>0) curr_contact.url=web[0].href;
        if(/Contact Name/.test(label[0].innerText)) {
            split_text=value[0].innerText.trim().split(", ");
            curr_contact.name=split_text[0];
            if(split_text.length>1) curr_contact.title=split_text[1];
            if((web=value[0].getElementsByTagName("a")).length>0) curr_contact.email=web[0].href.replace(/^\s*mailto:\s*/,"");
        }
    }
    Schools.contact_list.push(curr_contact);
    resolve("");
    return true;
};
Schools.AR.get_state_dir=function(resolve,reject) {
    var url="https://adedata.arkansas.gov/spd/Home/schools";
    var promise=MTP.create_promise(url,Schools.AR.grab_token,resolve,reject);
};
/* Grab token and query */
Schools.AR.grab_token=function(doc,url,resolve,reject) {
    var token=doc.getElementsByName("__RequestVerificationToken")[0].value;
    var data={"__RequestVerificationToken":token,"AlphabetKey":"","SearchValue":Schools.name.replace(/\s/g,"+"),"TitleId":"",
              "SortField":"DirectoryName"};
    var data_str=MTP.json_to_post(data).replace(/%2B/g,"+");
    var headers={"Content-Type": "application/x-www-form-urlencoded","host":"adedata.arkansas.gov","origin":"https://adedata.arkansas.gov",
                 "referer":"https://adedata.arkansas.gov/spd/Home/schools","Upgrade-Insecure-Requests":"1"};
    GM_xmlhttpRequest({method: 'POST', url: url,data:data_str,headers:headers,
                       onload: function(response) {
                           var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                           Schools.AR.get_school_info(doc,response.finalUrl, resolve, reject); },
                       onerror: function(response) { reject("Fail"); },
                       ontimeout: function(response) { reject("Fail"); }
                      });
};
Schools.AR.get_school_info=function(doc,url,resolve,reject) {
    var item=doc.getElementsByClassName("data-item"),i,result=[],curr_person;
    if(item.length===0 && (resolve(result))) return;
    var grp=item[0].getElementsByClassName("tbl-group-item");
    for(i=0;i<grp.length; i++) {
        if((curr_person=Schools.parse_data_func(grp[i].innerText.replace(/(^|\n)[^\n]*:\s*\n/g,""))) &&
           Schools.matches_title_regex(curr_person.title)) result.push(curr_person);
    }
    resolve(result);
};

Schools.CA.get_state_dir=function(resolve,reject) {
    var url="https://www.cde.ca.gov/SchoolDirectory/districtschool?allSearch="+Schools.name.replace(/\s/g,"+")+"&simpleSearch=Y&page=0&tab=3";
    var promise=MTP.create_promise(url,Schools.CA.get_school_search,resolve,reject);
};
Schools.CA.get_school_search=function(doc,url,resolve,reject) {
    if(/\/details\?/.test(url) && Schools.CA.parse_school(doc,url,resolve,reject)) return;
    var table=doc.getElementsByTagName("table")[0],i,row,next_url,promise;
    //        console.log("table.outerHTML="+table.outerHTML);
    for(i=0;i<table.rows.length;i++) {
        if((row=table.rows[i]).cells.length>=4 && Schools.matches_name(row.cells[3].innerText.trim())
           && (next_url=row.cells[3].getElementsByTagName("a")).length>0) break;
    }
    if(next_url.length>0) promise=MTP.create_promise(MTP.fix_remote_url(next_url[0].href,url),Schools.CA.parse_school,resolve,reject);
    else resolve("");
    return true;
};
Schools.CA.parse_school=function(doc,url,resolve,reject) {
    var table=doc.getElementsByClassName("table"),i,row,curr_contact;
    for(i=0;i<table[0].rows.length;i++) {
        row=table[0].rows[i];
        curr_contact={};
        if(row.cells.length<2) continue;
        if(/Administrator|Chief Business Official|CDS Coordinator/.test(row.cells[0].innerText)) {
            curr_contact=Schools.parse_data_func(row.cells[1].innerText.replace(/\n\n+\s*/g,"\n")); }
        if(curr_contact && curr_contact.name&&curr_contact.title&&curr_contact.email) Schools.contact_list.push(curr_contact);
    }
    resolve("");
    return true;
};

Schools.KY.get_state_dir=function(resolve,reject) {
    var url="https://openhouse.education.ky.gov/Directory/Search";
    var headers={"Content-Type":"application/x-www-form-urlencoded","host":"openhouse.education.ky.gov",
                 "origin":"https://openhouse.education.ky.gov","referer":"https://openhouse.education.ky.gov/Directory",
                 "upgrade-insecure-requests": "1"};
    var data_str="search="+Schools.name.replace(/\s/g,"+")+"&x=0&y=0";
    GM_xmlhttpRequest({method: 'POST', url: url,data:data_str,headers:headers,
                       onload: function(response) {
                           var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                           Schools.KY.get_school_search(doc,response.finalUrl, resolve, reject); },
                       onerror: function(response) { reject("Fail"); },
                       ontimeout: function(response) { reject("Fail"); }
                      });
};
Schools.KY.get_school_search=function(doc,url,resolve,reject) {
    var result=doc.getElementById("schoolResult"),table,i,row,next_url="",inner_a,text,parsed;
    var new_url="https://openhouse.education.ky.gov/Directory/School/",data;
    var promise,scripts=result.getElementsByTagName("script"),reg1=/^.*kendoGrid\(/,reg2=/\);\}\);/;
    try {
        text=scripts[0].innerHTML.trim().replace(reg1,"").replace(reg2,"");
        data=JSON.parse(text).dataSource.data.Data;
        for(i=0;i<data.length;i++) {
            if(Schools.matches_name(data[i].SCH_NAME) && (
                promise=MTP.create_promise(new_url+data[i].SCH_ORG_ID,Schools.KY.parse_school,resolve,reject))) return;
        }
    }
    catch(error) { console.log("Error parsing="+error); resolve(""); }
    return true;
};
Schools.KY.parse_school=function(doc,url,resolve,reject) {
    var dist_info=doc.getElementsByClassName("DistrictInfo")[0].innerText,i,curr_contact={},j,tables,row,inner_a;
    tables=doc.querySelectorAll(".SchoolDetails table");
    Schools.school_phone=dist_info.match(/Phone:\s*(.*)/)[1];
    Schools.school_url=dist_info.match(/Web:\s*(.*)/)[1];
    for(i=0;i<tables.length;i++) {
        for(j=0;j<tables[i].rows.length; j++) {
            row=tables[i].rows[j];
            if(row.length<3) continue;
            curr_contact={name:row.cells[1].innerText.trim(),phone:Schools.school_phone,title:row.cells[0].innerText.trim(),
                          email:(inner_a=row.cells[2].getElementsByTagName("a")).length>0 ? inner_a[0].href.replace(/\s*mailto:\s*/,"") : ""};
            if(curr_contact.name.length>0 && curr_contact.email.length>0 && curr_contact.title.length>0) Schools.contact_list.push(curr_contact);

        }
    }
    resolve("");
    return true;

};
Schools.NJ.get_state_dir=function(resolve,reject) {
    var url="https://homeroom5.doe.state.nj.us/directory/school.php",data="school="+encodeURIComponent(Schools.name)+"&source=02";
    var headers={"Content-Type":"application/x-www-form-urlencoded","host":"homeroom5.doe.state.nj.us",
                 "origin":"https://homeroom5.doe.state.nj.us","referer":"https://homeroom5.doe.state.nj.us/directory/pub.php"};
    GM_xmlhttpRequest({method: 'POST', url: url,data:data,headers:headers,
                       onload: function(response) {
                           var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                           Schools.NJ.get_school_info(doc,response.finalUrl, resolve, reject); },
                       onerror: function(response) { reject("Fail"); },
                       ontimeout: function(response) { reject("Fail"); }
                      });
};
/* TODO: May want to play with matching the city here, e.g. Mt to Mount shit */
Schools.NJ.get_school_info=function(doc,url,resolve,reject) {
    var d_box=doc.getElementsByClassName("district_box"),i,tab,curr_text,result={},split_text;
    var temp_name,temp_addressLine1,temp_city,temp_state;
    for(i=0;i<d_box.length;i++) {
        if((tab=d_box[i].getElementsByTagName("table")).length===0) continue;
        curr_text=d_box[i].innerText.replace(tab[0].innerText,"").replace(/\s*\n\s*\n+/g,"\n").trim();
        split_text=curr_text.split("\n");
        temp_name=split_text[3].replace(/\s*\([\d]+\).*$/,"");
        temp_city=split_text[5].split(", ")[0];
        if(Schools.matches_name(temp_name) && Schools.matches_city(temp_city) &&
           resolve(Schools.NJ.parse_table(tab[0]))) return;
    }
};
Schools.NJ.parse_table=function(tab) {
    var result=[],i,curr_field={},split_text,j,match;
    for(i=0;i<tab.rows.length;i++) {
        split_text=tab.rows[i].cells[0].innerText.split(", ");
        curr_field={name:Schools.parse_name_func(split_text[0].trim()),title:split_text[1].trim()};
        split_text=tab.rows[i].cells[1].innerText.split("\n");
        for(j=0;j<split_text.length;j++) {
            if(match=split_text[j].match(email_re)) curr_field.email=match[0];
            else if(match=split_text[j].match(phone_re)) curr_field.phone=match[0];
        }
        if(Schools.matches_title_regex(curr_field.title)) result.push(curr_field);
    }
    return result;
};
Schools.UT.get_state_dir=function(resolve,reject) {
    var url="https://www.schools.utah.gov/School/GetList";
    GM_xmlhttpRequest({method: 'GET', url: url,
                       onload: function(response) {
                           var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                           Schools.UT.parse_schools_dir(doc,response.finalUrl, resolve, reject,response); },
                       onerror: function(response) { reject("Fail"); },
                       ontimeout: function(response) { reject("Fail"); }
                      });
};
/** TODO:  add option to check if more than name matches */
Schools.UT.parse_schools_dir=function(doc,url,resolve,reject,response) {
    var parsed,i,schools,curr_contact={"state":"UT"},x;
    var term_map={"PrincipalName":"name","PrincipalTitle":"title","PrincipalEmail":"email","URL":"url","Phone":"phone","Address1":"street",
                  "City":"city","Zip":"zip","GradeLow":"low","GradeHigh":"high"};
    try {
        schools=(parsed=JSON.parse(response.responseText)).Schools;
        for(i=0;i<schools.length;i++) {
            if(Schools.matches_name(schools[i].SchoolName)) {
                for(x in term_map) if(schools[i][x] || schools[i][x]===0) curr_contact[term_map[x]]=schools[i][x];
                if(curr_contact.name&&curr_contact.title&&curr_contact.email) Schools.contact_list.push(curr_contact);
                break; }
        }
    }
    catch(error) { console.log("Error parsing JSON in Schools.UT.parse_schools_dir "+error); }
    resolve("");
};
Schools.WI.get_state_dir=function(resolve,reject) {
    var url="https://apps4.dpi.wi.gov/SchoolDirectory/Search/DisplayPublicSchools";
    var headers={"Content-Type": "application/x-www-form-urlencoded","host":"apps4.dpi.wi.gov",
                 "origin":"https://apps4.dpi.wi.gov",
                 "referer":"https://apps4.dpi.wi.gov/SchoolDirectory/Search/PublicSchoolsSearch",
                 "X-Requested-With":"XMLHttpRequest"};
    var data={"SearchText":"Grand Marsh","DisplayRegularSchools":true,"CountyId":"","CesaId":""};
    var data_str=MTP.json_to_post(data);
    GM_xmlhttpRequest({method: 'POST', url: url,data:data_str,headers:headers,
                       onload: function(response) {
                           console.log("response="+JSON.stringify(response));
                           var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                           Schools.WI.parse_school_results(doc,response.finalUrl,resolve,reject); },
                       onerror: function(response) { reject("Fail"); },
                       ontimeout: function(response) { reject("Fail"); }
                      });
};
Schools.WI.parse_school_results=function(doc,url,resolve,reject) {
    //        console.log("doc.body.innerHTML="+doc.body.innerHTML);
    var table=doc.getElementById("grid"),i,row,good_link,promise;
    if(table.tagName!=="TABLE") table=table.getElementsByTagName("table")[0];
    // console.log("table.outerHTML="+table.outerHTML);
    for(i=0;i<table.rows.length;i++) {
        if((row=table.rows[i]).cells.length>0 && Schools.matches_name(row.cells[0].innerText.trim()) &&
           (good_link=row.cells[0].getElementsByTagName("a")).length>0) break;
    }
    // console.log("good_link[0].href="+good_link[0].href);
    if(good_link && good_link.length>0) promise=MTP.create_promise(MTP.fix_remote_url(good_link[0].href,url),Schools.WI.parse_school_data,resolve,reject);
};
Schools.WI.parse_school_data=function(doc,url,resolve,reject) {
    var table=doc.getElementsByTagName("table"),i,row,curr_contact={},label,text;
    var form_map={"name:":/^Contact/,"title":/^Title/,"url":/^Website/,"phone":/^Phone/,"ext":/^Extension/,"email":/^Email/,
                  "address":/^Physical Address/,"mailing_address":/^Mailing Address/,"school_type":/^School Type/},x;
    try {
        for(i=1;i<table[0].rows.length;i++) {
            label=table[0].rows[i].getElementsByClassName("formLabel")[0].innerText.trim();
            text=table[0].rows[i].getElementsByClassName("formText")[0].innerText.trim();
            for(x in form_map) if(form_map[x].test(label)) curr_contact[x]=text;
        }
    }
    catch(error) { console.log("Error parsing table in WI.parse_school_data "+error); }
    if(curr_contact.phone!==undefined && curr_contact.ext!==undefined) curr_contact.phone+=" x"+curr_contact.ext;
    Schools.contact_list.push(curr_contact);
    resolve("");
};
Schools.WY.get_state_dir=function(resolve,reject) {
    var url="https://fusion.edu.wyoming.gov/Login/Web/Pages/OnlineDirectory/OnlineDirectorySchoolSearch.aspx";
    var promise=MTP.create_promise(url,Schools.WY.make_state_query,resolve,reject);
};
Schools.WY.make_state_query=function(doc,url,resolve,reject) {
    var new_url="https://fusion.edu.wyoming.gov/Login/Web/Pages/OnlineDirectory/OnlineDirectorySchoolSearch.aspx";
    var headers={"host":"fusion.edu.wyoming.gov","origin":"https://fusion.edu.wyoming.gov",
                 "referer":"https://fusion.edu.wyoming.gov/Login/Web/Pages/OnlineDirectory/OnlineDirectorySchoolSearch.aspx",
                 "Content-Type":"application/x-www-form-urlencoded","Upgrade-Insecure-Requests": "1"};
    var data={},data_str,i,inp=doc.getElementsByTagName("input"),sel=doc.getElementsByTagName("select");
    for(i=0;i<inp.length;i++) if(inp[i].type==="text"||inp[i].type==="hidden") data[inp[i].name]=inp[i].value;
    for(i=0;i<sel.length;i++) data[sel[i].name]=sel[i].value;
    data.txtSchoolname=Schools.name;
    data.HidPageCount="1";
    data["ImgSearch.x"]=25;
    data["ImgSearch.y"]=10;
    //data.__EVENTTARGET="dtgPersonExport$ctl02$ctl00";
    data_str=MTP.json_to_post(data).replace(/%20/g,"+");
    //console.log("data="+JSON.stringify(data));
    //console.log("data_str="+data_str);
    GM_xmlhttpRequest({method: 'POST', url: url,headers:headers,data:data_str,
                       onload: function(response) {
                           var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                           Schools.WY.make_state_query_get_orgid(doc,response.finalUrl,resolve,reject,response)
                       },
                       onerror: function(response) { reject("Fail"); },
                       ontimeout: function(response) { reject("Fail"); }
                      });
};
/* After getting the list we get the org query */
Schools.WY.make_state_query_get_orgid=function(doc,url,resolve,reject) {

    var new_url="https://fusion.edu.wyoming.gov/Login/Web/Pages/OnlineDirectory/OnlineDirectorySchoolSearch.aspx";
    var headers={"host":"fusion.edu.wyoming.gov","origin":"https://fusion.edu.wyoming.gov",
                 "referer":"https://fusion.edu.wyoming.gov/Login/Web/Pages/OnlineDirectory/OnlineDirectorySchoolSearch.aspx",
                 "Content-Type":"application/x-www-form-urlencoded","Upgrade-Insecure-Requests": "1"};
    var data={},data_str,i,inp=doc.getElementsByTagName("input"),sel=doc.getElementsByTagName("select");
    var table=doc.querySelector(".DataGridStyle"),row,evt_target_num=2;
    if(!table) resolve("");

    for(i=1;i<table.rows.length && i < 9;i++) {
        if((row=table.rows[i]) && row.cells.length>=6 && Schools.matches_name(row.cells[0].innerText.trim()) &&
           (evt_target_num=i+1)) {
            Schools.phone="307-"+row.cells[1].innerText.trim();Schools.street=row.cells[3].innerText.trim();
            Schools.city=row.cells[4].innerText.trim();Schools.state="WY";Schools.zip=row.cells[5].innerText.trim();
            break; }
    }
    for(i=0;i<inp.length;i++) if(inp[i].type==="text"||inp[i].type==="hidden") data[inp[i].name]=inp[i].value;
    for(i=0;i<sel.length;i++) data[sel[i].name]=sel[i].value;
    data.txtSchoolname=Schools.name;
    data.HidPageCount="1";
    data.__EVENTTARGET="dtgPersonExport$ctl0"+(evt_target_num.toString())+"$ctl00";
    data_str=MTP.json_to_post(data).replace(/%20/g,"+");
    GM_xmlhttpRequest({method: 'POST', url: url,headers:headers,data:data_str,
                       onload: function(response) {
                           var match,orgId;
                           if(match=response.finalUrl.match(/orgId\=([\d]+)/)) orgId=match[1];
                           else { resolve(""); return; }
                           //console.log("orgId="+orgId);
                           var url="https://fusion.edu.wyoming.gov/Login/Web/Pages/OnlineDirectory/OnlineDirectoryPersonnelContactList.aspx?orgId="+
                               orgId+"%20&LevelOneIndex=2%20&LevelTwoIndex=7&LevelThreeIndex=2";
                           var promise=MTP.create_promise(url,Schools.WY.parse_results,resolve,reject); },
                       onerror: function(response) { reject("Fail"); },
                       ontimeout: function(response) { reject("Fail"); }
                      });
};
Schools.WY.parse_results=function(doc,url,resolve,reject) {
    var i,table=doc.querySelector(".DataGridStyle"),row,curr_contact={};
    if(!table) resolve("");
    for(i=1; i < table.rows.length;i++) {
        if((row=table.rows[i]) && row.cells.length>=4) {
            Schools.contact_list.push({name:Schools.parse_name_func(row.cells[0].innerText.trim()),email:row.cells[1].innerText.trim(),
				       title:row.cells[2].innerText.trim(),phone:Schools.phone,street:Schools.street,city:Schools.city,state:Schools.state,
				       zip:Schools.zip});
        }
    }
    resolve("");
};
