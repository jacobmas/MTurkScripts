// ==UserScript==
// @name         Adam tucker
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Get data for Adam tucker team members
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
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var automate=GM_getValue("automate",false);
    var frame_count=0;
    var email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%]+(\.[^<>()\[\]\\.,;:：\s@"\?]+)*)|("[^\?]+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

    var phone_re=/[\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6}/im;
    var fax_re=/Fax[:]?[\s]?([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;

    var team_links=[];

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
    function is_bad_name(b_name)
    {
	return false;
    }

    function check_if_bad(doc,url)
    {
        var title=doc.title;
        var infolink=doc.getElementsByClassName("info-link");

        if(infolink.length>0 && /crazydomains/.test(infolink[0].href))
        {
            document.getElementById("feedback").value="Page for sale";
            return true;
        }
        if(/403/.test(doc.title) || /404|Website not available/.test(doc.title) || url.indexOf("/error/")!==-1)
        {
            document.getElementById("feedback").value="Site won't load";
            return true;
        }

        else if(url.indexOf("suspendedpage.cgi")!==-1 || url.indexOf("defaultwebpage.cgi")!==-1)
        {
            document.getElementById("feedback").value="Page suspended";
            return true;
        }
        else if(url.indexOf(".gov.au")!==-1)
        {
             document.getElementById("feedback").value="Government website";
            return true;
        }
        else if(/Hugedomains\.com|Index of \/|Domain parked|parked domain/i.test(doc.title))
        {
            document.getElementById("feedback").value="Page for sale";
            return true;
        }
        else if(/Windows Server|(^IIS7$)/.test(doc.title))
        {
            document.getElementById("feedback").value="Site not configured";
            return true;
        }
        else if(doc.body.innerHTML.length<=10)
        {
            document.getElementById("feedback").value="Blank page";
            return true;
        }
        console.log("doc.body.innerHTML.length="+doc.body.innerHTML.length);
        console.log("doc.title="+doc.title+", url="+url);


        return false;
    }
    function parse_finance(response) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var frame=doc.getElementsByTagName("frame");
        if(frame.length>0 && frame_count===0)
        {
            frame_count++;
            GM_xmlhttpRequest({
                method: 'GET',
                timeout:15000,
                url:    frame[0].src,

                onload: function(response) {
                    //   console.log("On load in crunch_response");
                    //    crunch_response(response, resolve, reject);
                    console.log("Parsing finance again");
                    parse_finance(response);
                },
                onerror: function(response) { console.log("Fail initially");
                                             document.getElementById("feedback").value="Site won't load";
                                             check_and_submit(check_function,automate); },
                ontimeout: function(response) { console.log("Fail"); document.getElementById("feedback").value="Site won't load";
                                               check_and_submit(check_function,automate); }


            });
            return;
        }
        if(check_if_bad(doc,response.finalUrl)) { check_and_submit(check_function,automate); return; }
        var doc2;
        my_query.url=response.finalUrl;
        var begin_url=my_query.url.replace(/(https?:\/\/[^\/]+)\/?.*$/,"$1");
        my_query.begin_url=begin_url;
        var i,j;
        var footer=doc.getElementById("footer");
        var footertag=doc.getElementsByTagName("footer");
        var links=doc.links;
        var inner_p;
        var success=false;
        if(footer!==null)
        {

            if(footer.innerText.indexOf("Powered by YTML Canvas")!==-1) { console.log("Found YTML canvas"); parse_ytml(doc); return; }
            else {
                 success=false;
                console.log("Found footer");
              inner_p=footer.getElementsByTagName("p");
              i;
                for(i=0; i < inner_p.length; i++)
                { success=parse_abn_stuff(inner_p[i].innerText);
                }
            }
        }
        if(footertag.length>0)
        {
            console.log("Found footer tag");
            inner_p=footertag[0].getElementsByTagName("p");
            for(i=0; i < inner_p.length; i++) {
                parse_abn_stuff(inner_p[i].innerText); }
            parse_abn_stuff(footertag[0].innerText);
        }
        inner_p=doc.getElementsByTagName("p");
        search_p(inner_p);
        search_p(doc.getElementsByTagName("div"));
        add_to_sheet();
        console.log("Trying our_team");
        //  var new_url2=links[i].href.replace(/https?:\/\/[^\/]+\//,my_query.begin_url+"/");
        my_query.team_url=my_query.begin_url+"/our-team";
        GM_xmlhttpRequest({
            method: 'GET',
            url:    my_query.team_url,

            onload: function(response) {
                //   console.log("On load in crunch_response");
                //    crunch_response(response, resolve, reject);
                var doc2 = new DOMParser()
                .parseFromString(response.responseText, "text/html");
                console.log("response.finalUrl="+response.finalUrl);
                parse_team2(doc2);
            },
            onerror: function(response) { console.log("Fail"); },
            ontimeout: function(response) { console.log("Fail"); }


        });
        if(doc.getElementsByClassName("meet-our-team").length>0)
        {
            var adviser_name=doc.getElementsByClassName("adviser-name"), adviser_position=doc.getElementsByClassName("adviser-position");
            let team_count=0;
            for(i=0; i < adviser_name.length; i++)
            {
                if(/Adviser/i.test(adviser_position[i].innerText))
                {
                    team_count++;
                    document.getElementById("teamMember"+team_count+"Name").value=adviser_name[i].innerText;
                }
                 document.getElementById("teamSize").value=adviser_name.length;
                document.getElementById("numberOfAdvisers").value=team_count;


            }
        }
        else
        {
            let found_team=false;
            for(i=0; i < links.length; i++)
            {
                if(/Team|People/i.test(links[i].innerText) && !/^join/i.test(links[i].innerText) &&
                  !team_links.includes(links[i].href.replace(/https?:\/\/[^\/]+\//,my_query.begin_url+"/")))
                {
                    team_links.push(links[i].href.replace(/https?:\/\/[^\/]+\//,my_query.begin_url+"/"));
                    found_team=true;
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url:    links[i].href.replace(/https?:\/\/[^\/]+\//,my_query.begin_url+"/"),

                        onload: function(response) {
                            //   console.log("On load in crunch_response");
                            //    crunch_response(response, resolve, reject);
                            console.log("Generic url="+response.finalUrl);
                            var doc2 = new DOMParser()
                            .parseFromString(response.responseText, "text/html");
                            parse_team_generic(doc2);
                        },
                        onerror: function(response) { console.log("Fail"); },
                        ontixmeout: function(response) { console.log("Fail"); }


                    });
                }
                if(links[i].href.indexOf("about.html")!==-1) {
                    console.log("Found about.html");
                    var new_url=links[i].href.replace(/https?:\/\/[^\/]+\//,my_query.begin_url+"/");
                    my_query.about_url=new_url;
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url:    my_query.about_url,

                        onload: function(response) {
                            //   console.log("On load in crunch_response");
                            //    crunch_response(response, resolve, reject);
                            var doc2 = new DOMParser()
                            .parseFromString(response.responseText, "text/html");
                            parse_about(doc2);
                        },
                        onerror: function(response) { console.log("Fail"); },
                        ontimeout: function(response) { console.log("Fail"); }


                    });

                }
            }


        }



    }
    function add_people_pos(people,pos)
    {
        var i;
        var adv_count=0;
        for(i=0; i < people.length; i++)
        {
            if(/CFP|Planner|Financial Advis(?:e|o)r/.test(pos[i].innerText))
            {
                adv_count++;
                document.getElementById("teamMember"+adv_count+"Name").value=people[i].innerText;
            }
        }
        document.getElementById("teamSize").value=people.length;
        document.getElementById("numberOfAdvisers").value=adv_count;
    }

    function parse_team_generic(doc)
    {
        var i,j,team_count=0,total_count=0;
        var team_list=[];
        var field_list=["h6","h5","h4","h3","h2"];
        console.log("In parse_team_generic");
        if(doc.getElementsByClassName("person-name").length>0)
        {
            parse_team2(doc);
            return;
        }
        else if(doc.getElementsByClassName("p-profile__name").length>0)
        {
            add_people_pos(doc.getElementsByClassName("p-profile__name"),doc.getElementsByClassName("p-profile__pos"));
            return;
        }

       // console.log("doc.body.innerText="+doc.body.innerText);
        var h2=doc.getElementsByTagName("h5");
        if(h2.length===0) h2=doc.getElementsByTagName("h4");
        if(h2.length===0) h2=doc.getElementsByTagName("h3");
        if(h2.length===0) h2=doc.getElementsByTagName("h2");
        var parentNode;
        for(j=0; j < field_list.length; j++)
        {
            h2=doc.getElementsByTagName(field_list[j]);
            for(i=0; i < h2.length; i++)
            {
                parentNode=h2[i];
                while(parentNode.tagName!=="DIV" && parentNode.tagName!=="TABLE") parentNode=parentNode.parentNode;
                //console.log("("+i+"), parentNode.className="+parentNode.className+", innerText="+parentNode.innerText);

                if(h2[i].innerText.indexOf(" ")!==-1)
                {

                    let possible_person=h2[i].innerText.replace(/\s*–.*$/,"").replace(/DipFP/,"").trim();
                    let arr=nlp(possible_person).people().out('topk');
                    console.log("arr["+i+"]="+JSON.stringify(arr));
                    if(arr.length>0 && !team_list.includes(arr[0].normal))
                    {
                        total_count++;

                        if(!/Financial|DipFP/i.test(parentNode.innerText)) continue;
                        team_count++;
                        team_list.push(arr[0].normal);
                        var text=arr[0].normal.replace(/(?:^|\s)[a-z]{1}/g,function(match)
                                                       {
                            console.log("match="+match);
                            return match.toUpperCase(); });
                        my_query.fields["teamMember"+team_count+"Name"]=text;
                        document.getElementById("teamMember"+team_count+"Name").value=text;
                    }
                    if(team_count>=24) break;
                }

            }
            if(total_count.length>0) break;
        }
         document.getElementById("teamSize").value=total_count;
        document.getElementById("numberOfAdvisers").value=team_count;
    }

    function parse_team2(doc)
    {
        console.log("Parsing team2 ");//+doc.body.innerText);

        var i,j;
        var team_count=0;
        var adv_count=0;
        var person_name=doc.getElementsByClassName("person-name");
        var person_title=doc.getElementsByClassName("person-title");
        var team_member=doc.getElementsByClassName("team-member_name");
        var team_member_job=doc.getElementsByClassName("team-member_job");
        if(person_name.length>0 && person_name.length===person_title.length)
        {
            team_count=person_name.length;
            for(i=0; i < person_name.length; i++)
            {
                if(/Representative|Client|Planning|Adviser|Financial/i.test(person_title[i].innerText)&&adv_count<=23)
                {
                    adv_count++;
                    document.getElementById("teamMember"+adv_count+"Name").value=person_name[i].innerText;
                }
            }
        }
        else if(team_member.length>0)
        {
            team_count=team_member.length;
            for(i=0; i < team_member.length; i++)
            {
                if(/Representative|Client|Planning|Adviser|Financial/i.test(team_member_job[i].innerText)&&adv_count<=23)
                {
                    adv_count++;
                    document.getElementById("teamMember"+adv_count+"Name").value=team_member[i].innerText;
                }
            }
        }
        if(team_count>0 && adv_count>0)
        {
            document.getElementById("teamSize").value=team_count;
            document.getElementById("numberOfAdvisers").value=adv_count;
        }

    }

    function parse_about(doc)
    {
        var i;
        var wsite_footer=doc.getElementsByClassName("wsite-footer");
        if(wsite_footer.length>0)
        {
            var fonts=wsite_footer[0].getElementsByTagName("font");
            for(i=0; i < fonts.length; i++)
            {
                parse_abn_stuff(fonts[i].innerText);
            }
        }
    }
    /* Search paragraph (or innermost div) */

    function search_p(inner_p)
    {
        var i;
        let phone_re=/\(?\d{2}\)?\s*\d{4}\s*\d{4}/;
        var copyname_re=/(?:©|Copyright\s*[:-]?|©\s*Copyright\s*[:-]?|Copyright\s*©)\s*(?:\d{4})?(?:\sby\s)?\s*([A-Z][a-z][A-Za-z ]+)/i;
        var text;

         for(i=0; i < inner_p.length; i++) {

             if(inner_p[i].tagName==="DIV" && inner_p[i].getElementsByTagName("div").length>0) continue;
             text=inner_p[i].innerText.replace(/\s*©\s*Copyright\s*/i,"Copyright");
             if(copyname_re.test(text) && my_query.fields.companyName===undefined)
             {
                 console.log("Matched copyname on "+text+", "+JSON.stringify(text.match(copyname_re)));
                 my_query.fields.companyName=text.match(copyname_re)[1].replace(/All Rights .*$/i,"").trim();
                 if(!my_query.searchedName)
                {
                    my_query.searchedName=true;
                    search_name(my_query.fields.companyName,"companyName");
                }
                 
             }


           // console.log("inner_p (or div)["+i+"]="+inner_p[i].innerText);
            parse_abn_stuff(inner_p[i].innerText);

         }
    }







    function parse_abn_stuff(text)
    {
      //  text=text.replace(/^[\"\']+/g,"").replace(/^[^:]{2,20}:/,"").replace(/^\s*/,"");
        //text=text.replace(/^Copyright ©[\s\d]*/i,"");
       // console.log("text="+text);
        var abn_re=/^([^\(]{2,50}?)\(?\s*A(?:\.)?B(?:\.)?N(?:\.)?\s*([\d\s]*)/;//{2}\s*[\d]{3})/;//\s*[\d]{3}\s*[\d]{3})/;
        var trading_re=/trading as ([^\n,\|]+)/;
        var abn2_re=/Authorised Representative.*\s+of\s*([^,\|]*?)\s+ABN:?\s*([\d]{2}\s*[\d]{3}\s*[\d]{3}\s*[\d]{3})/i;
        var abn25_re=/Authorised Representative.*\s+of\s*([^\n\.\(]*)\s+(?:Australian Financial Services Licensee|AFSL)/i;
        var abn3_re=/Authorised Representative.*\s+of\s*([^\n\.\(\|,]*)/i;
        var abn4_re=/A(?:\.)?B(?:\.)?N(?:\.)?\s*([\d\s]+)/;
        var afsl_re=/(?:Australian Financial Services|AFSL|AFS Licence No.\s*)[^\d\n,]*([\d\s]+)/;
        var abn_match,abn2_match,afsl_match,abn25_match,abn3_match,abn4_match,trading_match;
        abn_match=text.replace(/^Copyright ©[\s\d]*/i,"")
        .replace(/©\s*Copyright\s*/i,"").match(abn_re);
        trading_match=text.match(trading_re);
        abn2_match=text.match(abn2_re);
        abn25_match=text.match(abn25_re);
        abn3_match=text.match(abn3_re);
        abn4_match=text.match(abn4_re);
        afsl_match=text.match(afsl_re);

        if(abn_match!==null)// && abn_match[1].length<100)
        {
            console.log("Matched company name with "+JSON.stringify(abn_match));
           my_query.fields.companyName=abn_match[1].trim();
            if(!my_query.searchedName)
            {
                my_query.searchedName=true;
                search_name(my_query.fields.companyName,"companyName");
            }
            my_query.fields.companyABN=abn_match[2];
        }
        else if(trading_match)
        {
            console.log("Matched trading with "+JSON.stringify(trading_match));
            my_query.fields.companyName=trading_match[1].trim();
            if(!my_query.searchedName)
            {
                my_query.searchedName=true;
                search_name(my_query.fields.companyName,"companyName");
            }
        }

        if(abn2_match)
        {
            console.log("Matched abn2 with "+abn2_match);
            my_query.fields["C.AFSLName"]=abn2_match[1];
            my_query.fields["AFSLABN"]=abn2_match[2];

        }
        else if(abn25_match)
        {
            console.log("Matched abn25 with "+abn25_match);
            my_query.fields["C.AFSLName"]=abn25_match[1];
            if(my_query.fields.AFSLABN===undefined && !my_query.searchedAFSL)
            {
                my_query.searchedAFSL=true;
                search_name(my_query.fields["C.AFSLName"],"C.AFSLName");
            }
        }
        else if(abn3_match)
        {
            console.log("Matched abn3 with "+abn3_match);
            my_query.fields["C.AFSLName"]=abn3_match[1];
            if(my_query.fields.AFSLABN===undefined && !my_query.searchedAFSL)
            {
                my_query.searchedAFSL=true;
                search_name(my_query.fields["C.AFSLName"],"C.AFSLName");
            }
        }
        else if(abn4_match)
        {
            console.log("Matched abn4 with "+abn4_match);
            my_query.fields.companyABN=abn4_match[1];
        }
        if(afsl_match!==null)
        {
            console.log("Matched afsl");
            my_query.fields.AFSLNumber=afsl_match[1];

        }
        add_to_sheet();
        
    }

    function search_name(name,field_name)
    {
        var promise_list=[];
        name=shorten_company_name(name);
        var query_list=["linkedin.com","facebook.com","twitter.com","instagram.com","youtube.com"];
        var i;
        var url="https://abr.business.gov.au/Search/ResultsActive?SearchText="+encodeURIComponent(name);
        console.log("searching at url="+url);
        GM_xmlhttpRequest({method: 'GET', url: url,
            onload: function(response) { parse_abr(response,field_name); },
            onerror: function(response) { console.log("Failed abr"); },
            ontimeout: function(response) { console.log("Failed abr"); }
            });

    }

    function add_to_sheet()
    {
        var x;
        console.log("Adding to sheet "+JSON.stringify(my_query.fields));
        for(x in my_query.fields)
        {

            document.getElementById(x).value=my_query.fields[x];
        }
    }



    function parse_abr(response,field_name)
    {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var content=doc.getElementById("content-matching");
        console.log("*** in parse_abr "+response.finalUrl);
        var i;
        var table,curr_row;
        var ABSname;
        if(field_name==="companyName") ABSname="companyABN";
        else ABSname="AFSLABN";
        var lower_name=shorten_company_name(my_query.fields[field_name]).toLowerCase();
        console.log("lower_name="+lower_name);
        if( my_query.fields[ABSname]!==undefined) return;
        try
        {
            table=content.getElementsByTagName("table")[0];
            for(i=1; i < table.rows.length; i++)
            {
                curr_row=table.rows[i];
                console.log("abr: ("+i+"), "+curr_row.cells[0].getElementsByTagName("a")[0].innerText+", "+
                            curr_row.cells[1].innerText.trim().toLowerCase());
                if((curr_row.cells[1].innerText.trim().toLowerCase().indexOf(lower_name)!==-1 ||
                  lower_name.indexOf(curr_row.cells[1].innerText.trim().toLowerCase())!==-1)
                  && my_query.fields[ABSname]===undefined
                       )
                {
                    my_query.fields[ABSname]=curr_row.cells[0].getElementsByTagName("a")[0].innerText.trim();
                    console.log("matched "+i);
                    break;
                }
//                else

            }

        }
        catch(error) { console.log("Error in parsing abr "+error); }
        add_to_sheet();


    }

 
    function parse_ytml(doc)
    {
        var i,j,k;


        var links=doc.links;
        var footer=doc.getElementById("footer");
        var footer_p=footer.getElementsByTagName("p");
        for(i=0; i < footer_p.length; i++)
        {
            parse_abn_stuff(footer_p[i].innerText);

        }
        for(i=0; i < links.length; i++)
        {
            if(links[i].href.indexOf("/about-us/our-team")!==-1)
            {
                var new_url=links[i].href.replace(/https?:\/\/[^\/]+\//,my_query.begin_url+"/");
                console.log("new_url="+new_url);
                my_query.team_url=new_url;
                GM_xmlhttpRequest({
                    method: 'GET',
                    url:    my_query.team_url,

                    onload: function(response) {
                        //   console.log("On load in crunch_response");
                        //    crunch_response(response, resolve, reject);
                        parse_team(response);
                    },
                    onerror: function(response) { console.log("Fail"); },
                    ontimeout: function(response) { console.log("Fail"); }


                });
                return;
            }
        }
    }

    function parse_team(response)
    {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var i,j;
        var inner_p;
        console.log("In parse_team");
        var team_count=1;
        var content_body=doc.getElementsByClassName("content_body");
        if(content_body.length>0)
        {
            var colsm=content_body[0].getElementsByClassName("col-sm-9");
            if(colsm.length>0)
            {

                for(i=0; i < colsm.length; i++)
                {
                    inner_p=colsm[i].getElementsByTagName("p");
                    if(inner_p.length>0 && team_count <= 24)
                    {
                        document.getElementById("teamMember"+team_count+"Name").value=inner_p[0].innerText.split(" - ")[0].trim();
                        team_count++;
                    }
                }
            }
            else
            {
                var name=doc.getElementsByClassName("name");
                for(i=0; i < name.length; i++)
                {
                    console.log("i="+i);
                    if(team_count<=24)
                    {
                        document.getElementById("teamMember"+team_count+"Name").value=name[0].innerText.trim();
                        team_count++;
                    }
                }
            }
        }
        document.getElementById("teamSize").value=team_count-1;
        document.getElementById("numberOfAdvisers").value=team_count-1;

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

    

    function abn_paste(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain").trim();
        console.log("Doing abn_paste, text.indexOf(\" \")="+text.indexOf(" ")+"\ttext.length="+text.length);
        if(text.indexOf(" ")===-1 && text.length===11)
        {
            text=text.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/,"$1 $2 $3 $4");
        }
        e.target.value=text;
    }

    function name_paste(e)
    {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain").trim();
        console.log("e.target.id="+e.target.id);
        my_query.fields[e.target.id]=text;
        add_to_sheet();
        search_name(text,e.target.id);
    }



    function team_paste(e)
    {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain").trim();
        var text_split=text.split(/\n/);
        document.getElementsByName("q.companyFinancialAdvice")[0].checked=true;
        var i;
        var id=e.target.id;

        var num=parseInt(id.replace(/^teamMember/,"").replace(/Name$/,""));
         var curr_pos=num;
        var team_list=[];
        for(i=0; curr_pos <= 24 && i < text_split.length; i++)
        {
            let possible_person=text_split[i].replace(/\s*–.*$/,"").trim();

            let arr=nlp(possible_person).people().out('topk');
            for(var x in arr)
            {
                console.log("arr["+x+"]="+JSON.stringify(arr[x]));
            }
            console.log("arr["+i+"]="+JSON.stringify(arr));
            if(arr.length>0 && !team_list.includes(arr[0].normal) && /\s/.test(arr[0].normal))
            {


                team_list.push(arr[0].normal);
                let new_text=arr[0].normal.replace(/(?:^|\s)[a-z]{1}/g,function(match)
                                               {
                    console.log("match="+match);
                    return match.toUpperCase(); });

            //    my_query.fields["teamMember"+curr_pos+"Name"]=new_text;
                document.getElementById("teamMember"+curr_pos+"Name").value=new_text;
                if(my_query.fields["teamMember"+curr_pos+"Name"]!==undefined) delete my_query.fields["teamMember"+curr_pos+"Name"];
                curr_pos++;
            }
            else if(text_split.length<2)
            {
                 document.getElementById("teamMember"+curr_pos+"Name").value=text_split[i];
                if(my_query.fields["teamMember"+curr_pos+"Name"]!==undefined) delete my_query.fields["teamMember"+curr_pos+"Name"];
                curr_pos++;
            }

        }
        my_query.fields.numberOfAdvisers=curr_pos-1;
        if(my_query.fields.numberOfAdvisers>24) my_query.fields.numberOfAdvisers=24;
        add_to_sheet();
    }



    function init_Query()
    {
        var rows=document.getElementsByClassName("row");
        var dont=document.getElementsByClassName("dont-break-out")[0].href;
        if(dont.indexOf("barbican.com.au")!==-1) dont="http://www.barbican.amp.com.au/";
        var my_row=document.createElement("div");
        my_row.className="row";
        var my_col=document.createElement("div");
        my_col.className="col-xs-12 col-md-12";
        var my_button=document.createElement("input");
        my_button.setAttribute("type","button");
        my_button.setAttribute("value","Clear Team");
        my_button.addEventListener("click",function() {
            var i;
            for(i=1; i <= 24; i++) { document.getElementById("teamMember"+i+"Name").value="";
                                   delete my_query.fields["teamMember"+i+"Name"];

                                   }
        });
        for(var i=1; i <= 24; i++) { document.getElementById("teamMember"+i+"Name").addEventListener("paste",team_paste); }

        my_col.appendChild(my_button);
        my_row.appendChild(my_col);
        rows[2].parentNode.insertBefore(my_row,rows[2]);

    //   var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        my_query={url:dont,fields:{},searchedAFSL:false};

        if(/com\.au/.test(my_query.url)) { document.getElementsByName("q.companyAustralian")[0].checked=true; }

        document.getElementById("companyABN").addEventListener("paste",abn_paste);
        document.getElementById("AFSLABN").addEventListener("paste",abn_paste);
        document.getElementById("companyName").addEventListener("paste",name_paste);
        document.getElementById("C.AFSLName").addEventListener("paste",name_paste);
         document.getElementById("AFSLNumber").addEventListener("paste",function(e)
                                                                {
           e.preventDefault();
        var text = e.clipboardData.getData("text/plain").trim();
             e.target.value=text;
             my_query.fields.AFSLNumber=text;
         });

        GM_xmlhttpRequest({
            method: 'GET',
            timeout:20000,
            url:    my_query.url,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             parse_finance(response);
            },
            onerror: function(response) { console.log("Fail initially");
                                         document.getElementById("feedback").value="Site won't load";
                                             check_and_submit(check_function,automate); },
            ontimeout: function(response) { console.log("Fail"); document.getElementById("feedback").value="Site won't load";
                                             check_and_submit(check_function,automate); }


            });




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
    else if(window.location.href.indexOf("instagram.com")!==-1)
    {
        GM_setValue("instagram_url","");
        GM_addValueChangeListener("instagram_url",function() {
            var url=GM_getValue("instagram_url");
            window.location.href=url;
        });
        do_instagram();
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
          /*  setTimeout(function() {

                if(GM_getValue("automate")) btns_secondary[0].click();
                }, 20000);*/
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