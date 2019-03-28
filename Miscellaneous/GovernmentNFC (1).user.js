// ==UserScript==
// @name         GovernmentNFC
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Scrapestar Government
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include *
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/jacobsscriptfuncs.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
     var MTurk=new MTurkScript(40000,200,[],begin_script,"A1TF2W0DUNJVQA");
    /* Gov.script_loaded is a map of urls to number loaded there, script total is a map of urls to total number needed there */
    var Gov=Gov||{contact_list:[],scripts_loaded:{},scripts_total:{},area_code:"",
                 split_lines_regex:/\s*\n\s*|\s*\t\s*|–|(\s+-\s+)|\||                     |	|	|●|•/};
    Gov.scrapers={"civicplus":Gov.scrape_civicplus,"revize":Gov.scrape_revize,
                 "none":Gov.scrape_none,"visioninternet":Gov.scrape_visioninternet,"municodeweb":Gov.scrape_municodeweb,
                  "infomedia":Gov.scrape_infomedia,"civiclive":Gov.scrape_civiclive,"egovlink":Gov.scrape_egovlink};
    //"govoffice":Gov.scrape_govoffice,
    Gov.muni_regex_str="((City)|(Town)|(Boro(ugh)?)|(County)|(Village)|(Municipal))";
    Gov.manager_regex_str="((Manager)|(Administrator)|(Supervisor))";
    Gov.title_regex_map={"city manager":new RegExp(Gov.muni_regex_str+"\\s+"+Gov.manager_regex_str)};
    //var MTurk=new MTurkScript(20000,200,[],init_Query,"[TODO]");
    function is_bad_name(b_name)
    {
        return false;
    }

    Gov.matches_dept_regex=function(title) {
        for(var i=0; i < Gov.query.dept_regex_lst.length; i++) if(title.match(Gov.query.dept_regex_lst[i])) return true;
        return false;
    };


    /* Gov.scrape_civicplus scrapes the civicplus directory system
       Needs work to allow it to only scrape the directories likely to have the queried contacts, far too slow to scrape them all
    */
    Gov.scrape_civicplus=function(doc,url,resolve,reject) {
        var directory_promise=MTurkScript.prototype.create_promise(url.replace(/\/$/,"")+"/Directory.aspx",
                                                                   Gov.parse_civicplus_directory,Gov.parse_civicplus_directory_then,
                                                                  Gov.parse_civicplus_no_directory);


    };
    /* Gov.parse_civicplus_directory parses the civicplus_directory page */
    Gov.parse_civicplus_directory=function(doc,url,resolve,reject) {
        var promise_list=[],i;
        console.log("In parse_civicplus_directory");
        var search_area=doc.getElementById("CityDirectoryLeftMargin") ||doc;
        /* Try based on lack of CityDirectoryLeftMargin */
        var links=search_area.getElementsByTagName("a");
        console.time("contacts");
        for(i=0; i < links.length; i++)
        {
            if(/Directory\.aspx\?did\=/i.test(links[i].href) && Gov.matches_dept_regex(links[i].innerText)) {
                Gov.directoryLink=MTurkScript.prototype.fix_remote_url(links[i].href,url)
                promise_list.push(MTurkScript.prototype.create_promise(Gov.directoryLink
                    ,Gov.get_civicplus_contacts,MTurkScript.prototype.my_then_func,
                MTurkScript.prototype.my_catch_func,links[i].innerText)); }
        }
        Promise.all(promise_list).then(
            function(response) {
                console.timeEnd("contacts");
            Gov.parse_contacts_then(response);
            });
    };


    /** TODO: not always table[0] ***/
    Gov.get_civicplus_contacts=function(doc,url,resolve,reject,text)
    {
        var table,i,j,x,curr_row,title_map;
        console.log("In Gov.get_civic_plus_contacts for "+text);
        if((table=doc.getElementsByTagName("table")).length>0)
        {
            console.log("table[0].innerText="+table[0].innerText);
            for(i=0; i < table[0].rows.length; i++)
            {

                if((curr_row=table[0].rows[i]).cells.length>0 &&
                   (!curr_row.cells[0].getAttribute("colspan") || curr_row.cells[0].getAttribute("colspan")==="1"))
                {
                    console.log("("+i+"), curr_row.cells[0].colspan="+curr_row.cells[0].getAttribute("colspan")+", innerText="+curr_row.innerText);

                    break;
                }
                console.log("curr_row["+i+"].innerText="+curr_row.innerText+",colspan="+curr_row.cells[0].getAttribute("colspan"));

            }
            title_map=Gov.guess_title_map(table[0].rows[i]);
            console.log("title_map="+JSON.stringify(title_map));
            if(!(title_map.name===undefined||title_map.title===undefined)) Gov.parse_table(table[0],title_map,i+1);
        }
        resolve("");
    };
    /* Gov.parse_civicplus_no_directory parses civicplus with no directory.aspx */
    Gov.parse_civicplus_no_directory=function(doc,url,resolve,reject) {
    };
    Gov.scrape_revize=function(doc,url,resolve,reject) { };
    Gov.scrape_govoffice=function(doc,url,resolve,reject) { };
    Gov.scrape_visioninternet=function(doc,url,resolve,reject) { };
    Gov.scrape_municodeweb=function(doc,url,resolve,reject) { };

    /** Gov.scrape_none scrapes a generic government website for employees */
    Gov.scrape_none=function(doc,url,resolve,reject) {
        console.log("In Gov.scrape_none");
        Gov.get_contact_links(doc,url,resolve,reject);
        var promise_list=[],i;
        for(i=0; i < Gov.contact_links.length; i++)
        {
            //console.log("i="+i+", Gov.contact_links[i]="+Gov.contact_links[i]);
            /* First load the scripts and tables into a non-displayed temp_div (there will be several), this should hopefully unhide the emails
               though you may need to load other scripts too, then parse them */
            promise_list.push(MTurkScript.prototype.create_promise(
                Gov.contact_links[i],Gov.load_scripts,Gov.parse_contacts_then));
        }
        for(i=0; i < Gov.dept_links.length; i++)
        {
             //console.log("i="+i+", Gov.dept_links[i]="+Gov.dept_links[i]);
            /* First load the scripts and tables into a non-displayed temp_div (there will be several), this should hopefully unhide the emails
               though you may need to load other scripts too, then parse them */
            promise_list.push(MTurkScript.prototype.create_promise(
                Gov.dept_links[i],Gov.parse_department,Gov.parse_contacts_then));
        }
        Promise.all(promise_list).then(function(response) { resolve("MOOOOOOOOOOOO "+response); });


    };
    /** Gov.parse_department parses a specific department page
     * TODO: a specific page that parses a page listing the departments
    **/
    Gov.parse_department=function(doc,url,resolve,reject) {
        var add_count;
        console.log("In Gov.parse_department at "+url);
        add_count=Gov.parse_contact_elems(doc,url,resolve,reject);
        resolve("Done department "+add_count);
    };

    /** Gov.load_scripts loads all the tables in a document into a special non-displayed div at the end of the current document  */
    Gov.load_scripts=function(doc,url,resolve,reject) {
        console.log("load scripts: "+url);
        var scripts_to_load=[],i,j,scripts=doc.getElementsByTagName("script"),curr_script;
        var temp_div=document.createElement("div"),head=document.head;
        temp_div.style.display="none";
        document.body.appendChild(temp_div);
        var tables=doc.querySelectorAll("table");
        for(i=0; i < tables.length; i++)
        {
            let temp_table_scripts=tables[i].getElementsByTagName("script");
            for(j=0; j < temp_table_scripts.length; j++) scripts_to_load.push(temp_table_scripts[j]);
            temp_div.appendChild(tables[i]);
        }

        /* Internal function to increment the number of scripts loaded and once all are loaded, parse the tables */
        function increment_scripts()
        {

            if((++Gov.scripts_loaded[url])>=Gov.scripts_total[url]) setTimeout(function() { Gov.parse_contact_tables(doc,url,resolve,reject,temp_div); }, 100);
        }

        Gov.scripts_loaded[url]=0;
        if((Gov.scripts_total[url]=scripts_to_load.length)===0) Gov.parse_contact_tables(doc,url,resolve,reject,temp_div);

        console.log("scripts_to_load.length="+scripts_to_load.length);
        for(i=0; i < scripts_to_load.length; i++)
        {
            curr_script=document.createElement("script");
            if(scripts_to_load[i] && (scripts_to_load[i].src===undefined || scripts_to_load[i].src.length===0))
            {
                curr_script.innerHTML=scripts_to_load[i].innerHTML;
                increment_scripts();
            }
            else if(scripts_to_load[i]) curr_script.src=scripts_to_load[i].src;
            else continue;
            curr_script.onload=increment_scripts;
            temp_div.appendChild(curr_script);
        }
    };

    /* Gov.get_area_code tries to find a (for now US) area code in the page.
     * would probably be better to have as general MTurkScript */
    Gov.get_area_code=function(doc) {
        var area_code_regex=/\((\d{3})(?:\s*area code)?/,area_code_match;
        if(area_code_match=doc.body.innerHTML.match(area_code_regex)) return "("+area_code_match[1]+")";
        else return "";
    };

    /** Gov.parse_contact_tables parses all the contact tables in a temporary div (temp_div) created at the bottom of the page for
     parsing purposes, with all scripts being loaded
     Fix to do if things are in individual divs

     */
    Gov.parse_contact_tables=function(doc,url,resolve,reject,temp_div) {
        var i,table=temp_div.querySelectorAll("table");
        var begin_row=0,title_map={},reverse_title_map={},x,add_count=0;
        Gov.area_code=Gov.get_area_code(doc);
        console.log("in parse_contact_tables for "+url);
        for(i=0; i < table.length; i++)
        {
            if(table[i].rows.length>0) title_map=Gov.guess_title_map(table[i].rows[0]);
            if(title_map.name===undefined||title_map.title===undefined)
            {
                /* uses last row of table here to label */
                if((title_map=Gov.guess_title_map_unlabeled(table[i]))&&
                   (title_map.name===undefined || title_map.title===undefined || title_map.email===undefined))
                {
                    continue;
                }
            }
            else begin_row=1;
            console.log("good title_map="+JSON.stringify(title_map));
            add_count=add_count+Gov.parse_table(table[i],title_map,begin_row);
        }
        /* No asynchronous calls so won't happen till after tables finish parsing right? */
        console.log("url="+url+", add_count="+add_count);
        if(add_count===0) Gov.parse_contact_elems(doc,url,resolve,reject);
        resolve("");
    };
    /**
     *
     */
    Gov.parse_contact_elems=function(doc,url,resolve,reject) {
        console.log("in parse_contact_elems for "+url);
        //console.log("doc.body.innerHTML="+doc.body.innerHTML);
        var div=doc.querySelectorAll("div"),i,add_count=0;

        div.forEach(function(elem) {
            var ret,p_adds=0;

            if(elem.querySelector("div")) return;

            Gov.fix_emails(elem);
            ret=Gov.parse_data_func(elem.innerText);
            //console.log("ret="+JSON.stringify(ret));
            if(ret.name && ret.title && ret.email && add_count++) Gov.contact_list.push(ret);
        });
        doc.querySelectorAll("p").forEach(function(inner_p) {
            var ret;
            //     console.log("inner_p.innerText="+inner_p.innerText);
            if(inner_p.querySelector("p")) return;
            Gov.fix_emails(inner_p);
            //                console.log("p.innerText="+elem.innerText);
            if((ret=Gov.parse_data_func(inner_p.innerText)) && ret.name && ret.title
               && ret.email && ++add_count) Gov.contact_list.push(ret);
        });
        return add_count;
    };
    /**
     * Gov.fix_emails in the sense of replace mailto and such
     */
    Gov.fix_emails=function(div,is_civic) {
        var inner_a=div.querySelectorAll("a");
        inner_a.forEach(function(elem) {
            if(/^\s*mailto:\s*/.test(elem.href)) elem.innerHTML=elem.innerHTML+"\n"+elem.href.replace(/^\s*mailto:\s*/,"");
        });
        if(is_civic) { Gov.fix_emails_civic(div); }
    };
    /**
     * Special civic decoding
     */
    Gov.fix_emails_civic=function(div) {
        var w_match,x_match;
        w_match=div.innerText.match(/var\s*w\s*\=\s*\'([^\']+)\'/);
        x_match=div.innerText.match(/var\s*x\s*\=\s*\'([^\']+)\'/);
        if(w_match && x_match) div.innerHTML=w_match[1]+"@"+x_match[1];
    };


    /* Gov.parse_table parses a generic table for contacts.
     * table is the table to parse, title_map maps (name,title,phone,email) to column number
     * reverse_title_map maps column number to name,title,phone,email (maybe fix to not need both)
     * it returns the number of contacts added successfully
     * TODO: fix to work with guess_table_map to deal with more complicated tables
     */
    Gov.parse_table=function(table,title_map,begin_row) {
        var i,j,x,curr_row,curr_contact,inner_a,title,dept="",reverse_title_map={},add_count=0;
        for(x in title_map) reverse_title_map[title_map[x]]=x;
        if(begin_row===undefined) begin_row=1;

        for(i=begin_row; i < table.rows.length; i++)
        {
            curr_row=table.rows[i];
            curr_contact={};
            for(j=0; j < curr_row.cells.length; j++)
            {
                title=reverse_title_map[j];
                if(title==="email" && (inner_a=curr_row.cells[j].getElementsByTagName("a")).length>0)
                {
                    curr_contact[title]=inner_a[0].href.replace(/\s*mailto:\s*/,"").replace(/\?.*$/,"").trim();
                }
                else if(title==="email") {
                    Gov.fix_emails(curr_row.cells[j],true);
                    curr_contact[title]=curr_row.cells[j].innerText.replace(/\s+\n\s+/g," ").trim(); }
                else if(title) curr_contact[title]=curr_row.cells[j].innerText.replace(/\s+\n\s+/g," ").trim();
                if(title==="phone" && !curr_contact[title].match(phone_re) &&
                  curr_contact[title].length>0 && !curr_contact[title].match(Gov.area_code)) curr_contact[title]=Gov.area_code+curr_contact[title];
                if(title==="title") curr_contact[title]=curr_contact[title];
            }
            if(curr_contact.name && curr_contact.title && (++add_count)) {
                curr_contact.title=dept+curr_contact.title;
                Gov.contact_list.push(curr_contact);
            }
            else if(curr_contact.title) { dept=curr_contact.title+" - "; };

        }
        return add_count;
    };

    /* Gov.parse_contacts_then is called after a single contact page is parsed */
    Gov.parse_contacts_then=function(result) {
        var i,fullname;
        console.log("parse_contacts_then: "+result);
        for(i=0; i < Gov.contact_list.length; i++)
        {
            if(Gov.id==="civicplus") Gov.contact_list[i].name=Gov.parse_name_func(Gov.contact_list[i].name.replace(/[A-Z]+,\s*/,""));
            console.log("contact_list["+i+"]="+JSON.stringify(Gov.contact_list[i]));
            fullname=MTurkScript.prototype.parse_name(Gov.contact_list[i].name);
            my_query.fields.cityManagerFirstName=fullname.fname;
            my_query.fields.cityManagerLastName=fullname.lname;
             my_query.fields.cityManagerEmail=Gov.contact_list[i].email;
            my_query.fields.cityManagerPhone=Gov.contact_list[i].phone;
            my_query.fields.cityManagerTitle=Gov.contact_list[i].title;
             my_query.fields.cityManagerLink=Gov.directoryLink;
            submit_if_done();
            return;


        }


    };

    /* Gov.guess_title_map tries to map in a simple manner the table columns to data types,
     * name,title,phone,email in particular
     * row is the putative header row.
     * TODO: make suitable for annoying weird-type tables with multiple elements per column */
    Gov.guess_title_map=function(row) {
        var i,curr_cell,ret={};
        for(i=0;i<row.cells.length; i++)
        {
            curr_cell=row.cells[i].innerText.trim();

            if(/(Department)/i.test(curr_cell)) ret.department=i;
            else if(/First Name/i.test(curr_cell)) ret.first=i;
            else if(/Last Name/i.test(curr_cell)) ret.last=i;
            else if(/(Name|Employee)/i.test(curr_cell)) ret.name=i;
            else if(/(Title|Position|Profession)/i.test(curr_cell)) ret.title=i;
            else if(/(Tel|Phone)/i.test(curr_cell)) ret.phone=i;
            else if(/mail/i.test(curr_cell)) ret.email=i;
        }
        return ret;

    };

    /* Gov.parse_name_func is a helper function for parse_data_func */
    Gov.parse_name_func=function(text) {
        var split_str,fname,lname,i;
        var appell=[/^Mr.\s*/,/^Mrs.\s*/,/^Ms.\s*/,/^Miss\s*/,/^Dr.\s*/],suffix=[/,?\s*Jr\.?/];
        for(i=0; i < appell.length; i++) text=text.replace(appell[i],"");
        if(/[a-z]{2,}/.test(text)) {
            text=text.replace(/(,?\s*[A-Z]+)+$/,""); }
        for(i=0; i < suffix.length; i++) text=text.replace(suffix[i],"");
        return text.replace(/^([^,]+),\s*(.*)$/,"$2 $1");
    };


    /**
     * Gov.parse_data_func parses text
     */
    Gov.parse_data_func=function(text) {
        var ret={};
        var fname="",lname="",i=0,j=0, k=0;
        var curr_line, s_part="", second_arr,begin_name;
        var has_pasted_title=false;
        if((text=text.trim()).length===0) return ret;
        var split_lines_1=(text=text.trim()).split(Gov.split_lines_regex),split_lines=[],temp_split_lines,new_split;
        var found_email=false;
        if(/^[^\s]+\s+[^\s]+,\s*[A-Z\.]*[^A-Z\s\n,]+/.test(split_lines_1[0])) {
            split_lines=split_lines_1[0].split(",").concat(split_lines_1.slice(1));
        }
        else split_lines=split_lines_1;
        if(/:/.test(split_lines[0])) split_lines=split_lines[0].split(":").concat(split_lines.slice(1));
        split_lines=split_lines.filter(line => line);
        /** Additional code **/
        if(/Director|Department|Supervisor|Manager|Clerk/.test(split_lines[0]) &&
          (temp_split_lines=split_lines.splice(0,1))) split_lines.splice(1,0,temp_split_lines[0]);
        /** End additional code **/

        //console.log("parse_data_func: "+JSON.stringify(split_lines));
        var good_stuff_re=/[A-Za-z0-9]/;
        if(split_lines===null) return;
        for(j=0; j < split_lines.length; j++)
        {
            if(split_lines.length>0 && split_lines[j] && split_lines[j].trim().length > 0
               && good_stuff_re.test(split_lines[j])) break;
        }
        if(j>=split_lines.length) return ret;
        var split_comma=split_lines[j].split(/,/);
        if(split_comma.length===2 && /[^\s]\s/.test(split_comma[0])) {
           // console.log("Doing split_comma");
            var curr_last=split_lines.length-1;
            split_lines.push(split_lines[curr_last]);
            for(k=curr_last; k>=j+2; k--) split_lines[k]=split_lines[k-1];
            split_lines[j]=split_comma[0];
            split_lines[j+1]=split_comma[1];
        }

        if(split_lines.length>0 && j<split_lines.length &&
           split_lines[j] && split_lines[j].trim().length > 0) {
            if(!/\s/.test((begin_name=split_lines[j].trim()))
               && j+1 < split_lines.length) begin_name=begin_name+" "+split_lines[(j++)+1];
            ret.name=Gov.parse_name_func(begin_name);
        }
       // console.log("split_lines.length="+split_lines.length);
        for(i=j+1; i < split_lines.length; i++)
        {
            found_email=false;
            if(split_lines[i]===undefined || !good_stuff_re.test(split_lines[i])) continue;
          //  console.log("i="+i+", split_lines[i]="+split_lines[i]);
            curr_line=split_lines[i].trim();

            second_arr=curr_line.split(/:\s+/);
            if(/Title:/.test(curr_line) && (ret.title=curr_line.replace(/.*Title:\s*/,"").trim())) continue;
          //  console.log("curr_line="+curr_line+", second_arr.length="+second_arr.length);
            s_part=second_arr[second_arr.length-1].trim();
            //console.log("s_part="+s_part);
            if(email_re.test(s_part) && (found_email=true)) ret.email=s_part.match(email_re)[0];
            else if(phone_re.test(s_part)) ret.phone=s_part.match(phone_re)[0];
            else if(s_part.length>10 && s_part.substr(0,10)==="Phone Icon" &&
                    phone_re.test(s_part.substr(11))) ret.phone=s_part.substr(11).match(phone_re)[0];
            else if((s_part.trim().length>0  && !has_pasted_title) || s_part.indexOf("Title:")!==-1)
            {
                if(/^ext/.test(s_part)) ret.phone=(ret.phone+" "+s_part.trim()).trim();
                else if(has_pasted_title=true) ret.title=s_part.replace(/^Title:/,"").trim();
            }
        }
        return ret;
    };

    /* Gov.guess_title_map_unlabeled tries to map in a simple manner the table columns to data types,
     * name,title,phone,email based on form of rows
     * row is the putative header row.
     * TODO: make suitable for annoying weird-type tables with multiple
     * elements per column, maybe by adding add'l column */
    Gov.guess_title_map_unlabeled=function(table) {
        var i=table.rows.length-1,curr_cell,ret={},row;
        var title_regex=/(^|\s|,)(Clerk|Supervisor|Director|Manager|Fiscal|Rep\.|Assistant|Code)($|\s|,)/;
        while(i>=0 && ((row=table.rows[i]).cells.length===0 || (row.cells[0].innerText.trim().length===0))) i--;
        if(i<0) return ret;
        for(i=0;i<row.cells.length; i++)
        {
            curr_cell=row.cells[i].innerText.trim();
       //     console.log("cell["+i+"]="+curr_cell);
            if(email_re.test(curr_cell)) ret.email=i;
            else if(phone_re.test(curr_cell)) ret.phone=i;
            else if(ret.name===undefined &&
                   !(ret.title===undefined &&
                     title_regex.test(curr_cell))) ret.name=i;
            else if(ret.title===undefined) ret.title=i;
        }
        return ret;

    };


    /*

    Grabs the contact page links from the main page
     Maybe make scraping contact links a generic thing for MTurkScripts ...
     dunno if form thing should be left out
    */
    Gov.get_contact_links=function(doc,url,resolve,reject) {
        var i,j;
        var contact_regex=/Contact|Email|Directory|(^About)|(^Departments)/i,bad_link_regex=/(^\s*(javascript|mailto):)|(\/tag\/)/i;
        var contacthref_regex=/contact/i;
        Gov.contact_links=[];
        for(i=0; i < doc.links.length; i++) {
            if((contact_regex.test(doc.links[i].innerText) || contacthref_regex.test(doc.links[i].href)) &&
               !bad_link_regex.test(doc.links[i].href) && !Gov.contact_links.includes(doc.links[i].href)) Gov.contact_links.push(doc.links[i].href);
            for(j=0; j < Gov.query.dept_regex_lst.length; j++)
            {
                if(Gov.query.dept_regex_lst[j].test(doc.links[i].innerText) &&
                  !Gov.dept_links.includes(doc.links[i].href)) { Gov.dept_links.push(doc.links[i].href); break; }
            }
        }
        console.log("Gov.dept_links="+JSON.stringify(Gov.dept_links));
        Gov.contact_links.forEach(function(elem) {
            console.log("("+elem+")"); });

    };

    var emailProtector=emailProtector||{};
    emailProtector.addCloakedMailto=function(g,l){
        var h=document.querySelectorAll("."+g),i;
        for(i=0;i<h.length;i++){
            var b=h[i],k=b.getElementsByTagName("span"),e="",c="";
            b.className=b.className.replace(" "+g,"");
            for(var f=0;f<k.length;f++) {
                for(var d=k[f].attributes,a=0;a<d.length;a++) {
                    0===d[a].nodeName.toLowerCase().indexOf("data-ep-acd80")&&(e+=d[a].value),
                        0===d[a].nodeName.toLowerCase().indexOf("data-ep-bc962")&&(c=d[a].value+c); }
            }
            if(!c) break;
            b.innerHTML=e+c;
            if(!l )break;
            b.parentNode.href="mailto:"+e+c
        }
    };

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
            for(i=0; i < b_algo.length && i < 5; i++)
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
                    //break;

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

    function add_to_sheet() {
        var x,field;
        for(x in my_query.fields) if(field=document.getElementById(x)) field.value=my_query.fields[x];
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }


    /**  Gov.identify_site works with the MTurkScript.prototype.create_promise format to
     * identify the "type" of municipal govt website, then resolves and does the callback
     * of govt website */
    Gov.identify_site=function(doc,url,resolve,reject) {
        console.time("id_promise");
        Gov.home=doc;
        Gov.home_url=url;
        Gov.id_resolve=resolve;
        Gov.id_reject=reject;
        Gov.id_from_links(doc,url,resolve,reject,0);
    };

    /**
     * Gov.id_from_links searches to a level/depth of 1 to find links that identify the Content Management System
     * powering the site to enable how to best do scrapes
     *  */
    Gov.id_from_links=function(doc,url,resolve,reject,level) {
        var i;
        var links=doc.links,scripts=doc.scripts;
        var follow_lst=[],promise_lst=[],gov_match;
        console.log("url="+url+", level="+level);
        for(i=0; i < links.length; i++)
        {
            if(Gov.id_promise.done) return;
            if(gov_match=links[i].href.match(Gov.id_regex))
            {
                Gov.id_promise.done=true;
                Gov.id_resolve(gov_match[0].replace(/\.com$/,""));
                return;
            }
            if(/Copyright/.test(links[i].innerText)) follow_lst.push(
                MTurkScript.prototype.fix_remote_url(links[i].href,url));
        }

        if(level===0)
        {
            Gov.follow_done=0;
            Gov.follow_count=follow_lst.length;
            if(follow_lst.length===0)
            {
                Gov.id_promise.done=true;
                Gov.id_resolve("none");
                return;
            }
            for(i=0; i < follow_lst.length; i++)
            {
                console.log("follow_lst["+i+"].href="+follow_lst[i]);
                promise_lst.push(MTurkScript.prototype.create_promise(follow_lst[i],
                                                         Gov.id_from_links,MTurkScript.prototype.my_catch_func,
                                                        MTurkScript.prototype.my_catch_func,level+1));
            }
        }
        else
        {
            Gov.follow_done++;
            if(Gov.follow_done>=Gov.follow_count && !Gov.id_promise.done)
            {
                Gov.id_promise.done=true;
                Gov.id_resolve("none");
                return;
            }
        }
        return;

    };
    /* Gov.gov_id_promise_then following resolving the type of site. It then calls the scraper for that type of site
     * (TODO) lots
    */
    Gov.gov_id_promise_then=function(result) {
        console.timeEnd("id_promise");
        Gov.id_promise.done=true;
        Gov.id=result;
        console.log("id result="+result);
        Gov.scrape_promise=new Promise((resolve,reject) => {
            Gov["scrape_"+Gov.id](Gov.home,Gov.home_url,resolve,reject);
        })
        .then(function(response) { console.log("scrape_response="+JSON.stringify(response)); });


    };

    /** Gov.init_Gov will initialize government search being given a url (string) and a query (object)
     *
     * query:{dept_regex_lst:array,title_regex_lst:array} for now querytype should always be search, dept_regex_lst
     * should be a list of regular expressions that correspond to good either department or title
     */
    Gov.init_Gov=function(url,query)
    {
        let id_regex_str="",x;
        for(x in Gov.scrapers) {
            if(x!=="none")
            {
                if(id_regex_str.length>0) id_regex_str=id_regex_str+"|";
                id_regex_str=id_regex_str+x+"\\.com"; }
        }
        Gov.url=url;
        Gov.query=query;
      //  console.log("Gov.query="+JSON.stringify(query));
        if(Gov.query.dept_regex_lst===undefined) {
            Gov.query.dept_regex_lst=[];
        }
        console.log("Gov.query.dept_regex_lst="+JSON.stringify(Gov.query.dept_regex_lst));
        Gov.dept_links=[];


        Gov.id_regex=new RegExp(id_regex_str);
        console.log("Gov.id_regex="+Gov.id_regex);
        /* Identifies the site type if any, then id_promise_then */

        Gov.id_promise=MTurkScript.prototype.create_promise(url,Gov.identify_site,Gov.gov_id_promise_then);
        Gov.id_promise.done=false;
    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0;
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined && Gov!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }

    function cityManager_paste(e) {
        e.preventDefault();
        // get text representation of clipboard
        var i;
        var text = ""+e.clipboardData.getData("text/plain");
        console.log("text="+text);
        var parsed=Gov.parse_data_func(text);
        console.log("parsed="+JSON.stringify(parsed));
        if(parsed.name) {
            var fullname=MTurkScript.prototype.parse_name(parsed.name);
            my_query.fields[my_query.title+"FirstName"]=fullname.fname;
            my_query.fields[my_query.title+"LastName"]=fullname.lname;
        }
        if(parsed.phone) my_query.fields[my_query.title+"Phone"]=parsed.phone;
        if(parsed.email) my_query.fields[my_query.title+"Email"]=parsed.email;
         if(parsed.title) my_query.fields[my_query.title+"Title"]=parsed.title;
        submit_if_done();



    }


    function init_Query()
    {
        var wT=document.getElementById("WebsiteDataCollection").getElementsByTagName("table")[0];

        var dept_regex_lst=[/City Manager|City Administrator/i];

        my_query={url:wT.rows[1].cells[1].innerText,fields:{}};
        GM_setClipboard(my_query.url);
        var ctrl=document.getElementsByClassName("form-control");
        var id_begin=ctrl[0].id.replace(/FirstName/,"");
        console.log("id_begin="+id_begin);
        my_query.title=id_begin;
        document.getElementById(my_query.title+"FirstName").addEventListener("paste",cityManager_paste);

        var query={"dept_regex_lst":dept_regex_lst};
        console.log("query="+JSON.stringify(query));
        var search_str="site:"+my_query.url+" campus recreation";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });

     /*   var my_promise=new Promise((resolve,reject) => {

            Gov.identify_site(document,window.location.href,resolve,reject);
        });*/
    }


})();