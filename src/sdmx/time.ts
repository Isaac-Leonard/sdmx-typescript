/*
    This file is part of sdmx-js.

    sdmx-js is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    sdmx-js is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with sdmx-js.  If not, see <http://www.gnu.org/licenses/>.
    Copyright (C) 2016 James Gardner
*/
//<reference path="../moment.d.ts"/>
import moment from "moment";

import * as collections from 'typescript-collections';
export class TimeUtil {
    public static LONG_MONTH_NAMES: Array<string> = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    public static SHORT_MONTH_NAMES: Array<string> = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    public static stringToMonthCode(s: string) {
        for (var i: number = 0; i < TimeUtil.LONG_MONTH_NAMES.length; i++) {
            if (TimeUtil.LONG_MONTH_NAMES[i] == s) return collections.arrays.indexOf(TimeUtil.LONG_MONTH_NAMES, s);
        }
        for (var i: number = 0; i < TimeUtil.SHORT_MONTH_NAMES.length; i++) {
            if (TimeUtil.SHORT_MONTH_NAMES[i] == s) return collections.arrays.indexOf(TimeUtil.SHORT_MONTH_NAMES, s);
        }
        return 1;
    }
    /* notes from Edgardo Greising from ILO.org
        The concept of Time Format is sometimes tied to the frequency, 
        but more precisely to the reference period of the datum. 
        In our case the time format can be taken from the time value 
        which is stored in a proprietary extension of the ISO 8601 format
        that we call "User format". It is defined as [YYYY] for years (Ex.: 2009), 
        [YYYY]Q[Q] for quarters (Ex.: 2011Q3) and [YYYY]M[MM] for months (Ex.: 2014M06). 
        So the fourth character of the TIME concept value gives the reference period: 
        Yearly (by absence), Quarterly or Monthly. We can also use other codes to represent
        other periods like S for Semesters or W for weeks, but we don't have this type of 
        data so far. In any case, the valid codes are in the CL_FREQ codelist.
    */
    public static parseTime(freq: String, s: string): RegularTimePeriod {
        if ("" == s) {
            throw new Error("Time Detail of \'\'");
        }
        try {
            if ("A" == freq || "P1Y" == freq) {
                return Year.parseYear(s);
            }
            /*
                  else if ("B".equals(freq) || "P1B".equals(freq)) {
                return Day.parseDay(s);
            } else if ("D".equals(freq) || "P1D".equals(freq)) {
                return Day.parseDay(s);
            } */
            else if ("M" == freq || "P1M" == freq) {
                return Month.parseMonth(s);
            }/*
             else if ("Q".equals(freq) || "P3M".equals(freq)) {
                return Quarter.parseQuarter(s);
            } else if ("S".equals(freq) || "P6M".equals(freq)) {
                return Semester.parseSemester(s);
            } else if ("W".equals(freq) || "P1W".equals(freq)) {
                return Week.parseWeek(s);
            }*/
        } catch (e) {
            console.log("Time:" + s + " is not a format for freq:" + freq)
        }
        var rtd: RegularTimePeriod = null;
        try {
            rtd = Year.parseYear(s);
        } catch (e) {
        }
        if (rtd != null) {
            return rtd;
        }
        /*
        try {
            rtd = Day.parseDay(s);
        } catch (TimePeriodFormatException tpe) {
        }catch(StringIndexOutOfBoundsException sioob) {
        }
        if (rtd != null) {
            return rtd;
        }
        */
        try {
            rtd = Month.parseMonth(s);
        } catch (e) {
        }
        if (rtd != null) {
            return rtd;
        }

        /*
        try {
            rtd = Quarter.parseQuarter(s);
        } catch (TimePeriodFormatException tpe) {
        }catch(StringIndexOutOfBoundsException sioob) {
        }
        if (rtd != null) {
            return rtd;
        }
        try {
            rtd = Semester.parseSemester(s);
        } catch (TimePeriodFormatException tpe) {
        }catch(StringIndexOutOfBoundsException sioob) {
        }
        if (rtd != null) {
            return rtd;
        }
        try {
            rtd = Week.parseWeek(s);
        } catch (TimePeriodFormatException tpe) {
        }catch(StringIndexOutOfBoundsException sioob) {
        }
        if (rtd != null) {
            return rtd;
        }
        */
        throw new Error("Null Frequency Field");
    }
}
/*
 * RegularTimePeriod and the classes that extend RegularTimePeriod are adapted
 * from classes from the JFreeChart (Java) library (all except Semester))
 * the copyright notice from RegularTimePeriod.java is included here;
 * -James Gardner 31/5/2016
 */
/* ===========================================================
 * JFreeChart : a free chart library for the Java(tm) platform
 * ===========================================================
 *
 * (C) Copyright 2000-2014, by Object Refinery Limited and Contributors.
 *
 * Project Info:  http://www.jfree.org/jfreechart/index.html
 *
 * This library is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public
 * License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301,
 * USA.
 *
 * [Oracle and Java are registered trademarks of Oracle and/or its affiliates. 
 * Other names may be trademarks of their respective owners.]
 *
 * ----------------------
 * RegularTimePeriod.java
 * ----------------------
 * (C) Copyright 2001-2014, by Object Refinery Limited.
 *
 * Original Author:  David Gilbert (for Object Refinery Limited);
 * Contributor(s):   -;
 *
 * Changes
 * -------
 * 11-Oct-2001 : Version 1 (DG);
 * 26-Feb-2002 : Changed getStart(), getMiddle() and getEnd() methods to
 *               evaluate with reference to a particular time zone (DG);
 * 29-May-2002 : Implemented MonthConstants interface, so that these constants
 *               are conveniently available (DG);
 * 10-Sep-2002 : Added getSerialIndex() method (DG);
 * 10-Jan-2003 : Renamed TimePeriod --> RegularTimePeriod (DG);
 * 13-Mar-2003 : Moved to com.jrefinery.data.time package (DG);
 * 29-Apr-2004 : Changed getMiddleMillisecond() methods to fix bug 943985 (DG);
 * 25-Nov-2004 : Added utility methods (DG);
 * ------------- JFREECHART 1.0.x ---------------------------------------------
 * 06-Oct-2006 : Deprecated the WORKING_CALENDAR field and several methods,
 *               added new peg() method (DG);
 * 16-Sep-2008 : Deprecated DEFAULT_TIME_ZONE (DG);
 * 23-Feb-2014 : Added getMillisecond() method (DG);
 * 
 */

export interface RegularTimePeriod {
    getStart(): Date;
    getFirstMillisecond(): number;
    getEnd(): Date;
    getLastMillisecond(): number;
    /**
     * Returns the time period preceding this one, or <code>null</code> if some
     * lower limit has been reached.
     *
     * @return The previous time period (possibly <code>null</code>).
     */
    previous(): RegularTimePeriod;

    /**
     * Returns the time period following this one, or <code>null</code> if some
     * limit has been reached.
     *
     * @return The next time period (possibly <code>null</code>).
     */
    next(): RegularTimePeriod;

    /**
     * Returns a serial index number for the time unit.
     *
     * @return The serial index number.
     */
    getSerialIndex(): number;
}
export class AbstractRegularTimePeriod implements RegularTimePeriod {

    constructor() {

    }
    next(): RegularTimePeriod {
        return null;
    }
    previous(): RegularTimePeriod {
        return null;
    }
    getSerialIndex(): number {
        return 0;
    }
    /**
     * Returns the date/time that marks the start of the time period.  This
     * method returns a new <code>Date</code> instance every time it is called.
     *
     * @return The start date/time.
     *
     * @see #getFirstMillisecond()
     */
    public getStart(): Date {
        return new Date(this.getFirstMillisecond());
    }

    /**
     * Returns the date/time that marks the end of the time period.  This
     * method returns a new <code>Date</code> instance every time it is called.
     *
     * @return The end date/time.
     *
     * @see #getLastMillisecond()
     */
    public getEnd(): Date {
        return new Date(this.getLastMillisecond());
    }

    public getFirstMillisecond(): number {
        return 0;
    };

    /**
     * Returns the last millisecond of the time period.  This will be
     * determined relative to the time zone specified in the constructor, or
     * in the calendar instance passed in the most recent call to the
     * {@link #peg(Calendar)} method.
     *
     * @return The last millisecond of the time period.
     *
     * @see #getFirstMillisecond()
     */
    getLastMillisecond(): number {
        return 0;
    }

    /**
     * Returns the millisecond closest to the middle of the time period.
     *
     * @return The middle millisecond.
     */
    getMiddleMillisecond(): number {
        var m1: number = this.getFirstMillisecond();
        var m2: number = this.getLastMillisecond();
        return m1 + (m2 - m1) / 2;
    }
    toString(): string {
        return this.getStart().toString();

    }
}
export class MonthConstants {
    public static JANUARY: number = 1;
    public static FEBRUARY: number = 2;
    public static MARCH: number = 3;
    public static APRIL: number = 4;
    public static MAY: number = 5;
    public static JUNE: number = 6;
    public static JULY: number = 7;
    public static AUGUST: number = 8;
    public static SEPTEMBER: number = 9;
    public static OCTOBER: number = 10;
    public static NOVEMBER: number = 11;
    public static DECEMBER: number = 12;
    public static toMonthName(i: number) {
        switch (i) {
            case this.JANUARY: return "January";
            case this.FEBRUARY: return "February";
            case this.MARCH: return "March";
            case this.APRIL: return "April";
            case this.MAY: return "May";
            case this.JUNE: return "June";
            case this.JULY: return "July";
            case this.AUGUST: return "August";
            case this.SEPTEMBER: return "September";
            case this.OCTOBER: return "October";
            case this.NOVEMBER: return "November";
            case this.DECEMBER: return "December";
            default: return "Not A Month";
        }
    }
}
/**
 * Represents a year in the range -9999 to 9999.  This class is immutable,
 * which is a requirement for all {@link RegularTimePeriod} subclasses.
 */
export class Year extends AbstractRegularTimePeriod {

    /**
     * The minimum year value.
     *
     * @since 1.0.11
     */
    public static MINIMUM_YEAR: number = -9999;

    /**
     * The maximum year value.
     *
     * @since 1.0.11
     */
    public static MAXIMUM_YEAR: number = 9999;

    /** The year. */
    private year: number;


    /** The first millisecond. */
    private firstMillisecond: number;

    /** The last millisecond. */
    private lastMillisecond: number;

    /**
     * Creates a time period representing a single year.
     *
     * @param year  the year.
     */
    public constructor(year: number) {
        super();
        if ((year < Year.MINIMUM_YEAR) || (year > Year.MAXIMUM_YEAR)) {
            throw new Error(
                "Year constructor: year (" + year + ") outside valid range.");
        }
        this.year = year;
        var start: Date = new Date();
        start.setFullYear(year, MonthConstants.JANUARY, 1);
        this.firstMillisecond = start.getTime();
        var end: Date = new Date();
        end.setFullYear(year, MonthConstants.DECEMBER, 31);
        this.lastMillisecond = end.getTime();
    }

    /**
     * Returns the year.
     *
     * @return The year.
     */
    getYear(): number {
        return this.year;
    }

    /**
     * Returns the first millisecond of the year.  This will be determined
     * relative to the time zone specified in the constructor, or in the
     * calendar instance passed in the most recent call to the
     * {@link #peg(Calendar)} method.
     *
     * @return The first millisecond of the year.
     *
     * @see #getLastMillisecond()
     */
    getFirstMillisecond(): number {
        return this.firstMillisecond;
    }

    /**
     * Returns the last millisecond of the year.  This will be
     * determined relative to the time zone specified in the constructor, or
     * in the calendar instance passed in the most recent call to the
     * {@link #peg(Calendar)} method.
     *
     * @return The last millisecond of the year.
     *
     * @see #getFirstMillisecond()
     */
    getLastMillisecond(): number {
        return this.lastMillisecond;
    }


    /**
     * Returns the year preceding this one.
     *
     * @return The year preceding this one (or <code>null</code> if the
     *         current year is -9999).
     */
    public previous(): RegularTimePeriod {
        if (this.year > Year.MINIMUM_YEAR) {
            return new Year(this.year - 1);
        }
        else {
            return null;
        }
    }

    /**
     * Returns the year following this one.
     *
     * @return The year following this one (or <code>null</code> if the current
     *         year is 9999).
     */
    next(): RegularTimePeriod {
        if (this.year < Year.MAXIMUM_YEAR) {
            return new Year(this.year + 1);
        }
        else {
            return null;
        }
    }

    /**
     * Returns a serial index number for the year.
     * <P>
     * The implementation simply returns the year number (e.g. 2002).
     *
     * @return The serial index number.
     */
    getSerialIndex(): number {
        return this.year;
    }

    /**
     * Tests the equality of this <code>Year</code> object to an arbitrary
     * object.  Returns <code>true</code> if the target is a <code>Year</code>
     * instance representing the same year as this object.  In all other cases,
     * returns <code>false</code>.
     *
     * @param obj  the object (<code>null</code> permitted).
     *
     * @return <code>true</code> if the year of this and the object are the
     *         same.
     */
    equalsYear(obj: Object): boolean {
        if (obj == this) {
            return true;
        }
        if (!(obj instanceof Year)) {
            return false;
        }
        var that: Year = <Year>obj;
        return (this.year == that.year);
    }

    /**
     * Returns a hash code for this object instance.  The approach described by
     * Joshua Bloch in "Effective Java" has been used here:
     * <p>
     * <code>http://developer.java.sun.com/developer/Books/effectivejava
     *     /Chapter3.pdf</code>
     *
     * @return A hash code.
     */
    hashCode(): number {
        var result: number = 17;
        var c: number = this.year;
        result = 37 * result + c;
        return result;
    }

    /**
     * Returns an integer indicating the order of this <code>Year</code> object
     * relative to the specified object:
     *
     * negative == before, zero == same, positive == after.
     *
     * @param o1  the object to compare.
     *
     * @return negative == before, zero == same, positive == after.
     */
    compareTo(o1: Object): number {
        var result: number;

        // CASE 1 : Comparing to another Year object
        // -----------------------------------------
        if (o1 instanceof Year) {
            var y: Year = <Year>o1;
            result = this.year - y.getYear();
        }

        // CASE 2 : Comparing to another TimePeriod object
        // -----------------------------------------------
        else if (o1 instanceof AbstractRegularTimePeriod) {
            // more difficult case - evaluate later...
            result = 0;
        }

        // CASE 3 : Comparing to a non-TimePeriod object
        // ---------------------------------------------
        else {
            // consider time periods to be ordered after general objects
            result = 1;
        }

        return result;

    }

    /**
     * Returns a string representing the year..
     *
     * @return A string representing the year.
     */
    toString(): string {
        return this.year.toString();
    }

    /**
     * Parses the string argument as a year.
     * <P>
     * The string format is YYYY.
     *
     * @param s  a string representing the year.
     *
     * @return <code>null</code> if the string is not parseable, the year
     *         otherwise.
     */
    public static parseYear(s: string): Year {

        // parse the string...
        var y: number;
        try {
            y = parseInt(s.trim());
        }
        catch (e) {
            throw Error("Cannot parse string as Year." + s);
        }

        // create the year...
        try {
            return new Year(y);
        }
        catch (e) {
            throw new Error("Year outside valid range.");
        }
    }
}
export class Month extends AbstractRegularTimePeriod {

    /** The month (1-12). */
    private month: number;

    /** The year in which the month falls. */
    private year: number;

    /** The first millisecond. */
    private firstMillisecond: number;

    /** The last millisecond. */
    private lastMillisecond: number;

    /**
     * Constructs a new month instance.
     *
     * @param month  the month (in the range 1 to 12).
     * @param year  the year.
     */
    public constructor(month: number, year: number) {
        super();
        if ((month < 1) || (month > 12)) {
            throw new Error("Month outside valid range.");
        }
        this.month = month;
        this.year = year;
    }

    /**
     * Returns the year in which the month falls.
     *
     * @return The year in which the month falls (as a Year object).
     */
    public getYear(): RegularTimePeriod {
        return new Year(this.year);
    }

    /**
     * Returns the year in which the month falls.
     *
     * @return The year in which the month falls (as an int).
     */
    public getYearValue(): number {
        return this.year;
    }

    /**
     * Returns the month.  Note that 1=JAN, 2=FEB, ...
     *
     * @return The month.
     */
    public getMonth(): number {
        return this.month;
    }

    /**
     * Returns the first millisecond of the month.  This will be determined
     * relative to the time zone specified in the constructor, or in the
     * calendar instance passed in the most recent call to the
     * {@link #peg(Calendar)} method.
     *
     * @return The first millisecond of the month.
     *
     * @see #getLastMillisecond()
     */
    public getFirstMillisecond(): number {
        return this.firstMillisecond;
    }

    /**
     * Returns the last millisecond of the month.  This will be
     * determined relative to the time zone specified in the constructor, or
     * in the calendar instance passed in the most recent call to the
     * {@link #peg(Calendar)} method.
     *
     * @return The last millisecond of the month.
     *
     * @see #getFirstMillisecond()
     */
    public getLastMillisecond(): number {
        return this.lastMillisecond;
    }

    /**
     * Returns the month preceding this one.  Note that the returned
     * {@link Month} is "pegged" using the default time-zone, irrespective of
     * the time-zone used to peg of the current month (which is not recorded
     * anywhere).  See the {@link #peg(Calendar)} method.
     *
     * @return The month preceding this one.
     */
    public previous(): RegularTimePeriod {
        var result: Month;
        if (this.month != MonthConstants.JANUARY) {
            result = new Month(this.month - 1, this.year);
        }
        else {
            if (this.year > 1900) {
                result = new Month(MonthConstants.DECEMBER, this.year - 1);
            }
            else {
                result = null;
            }
        }
        return result;
    }

    /**
     * Returns the month following this one.  Note that the returned
     * {@link Month} is "pegged" using the default time-zone, irrespective of
     * the time-zone used to peg of the current month (which is not recorded
     * anywhere).  See the {@link #peg(Calendar)} method.
     *
     * @return The month following this one.
     */
    public next(): RegularTimePeriod {
        var result: Month;
        if (this.month != MonthConstants.DECEMBER) {
            result = new Month(this.month + 1, this.year);
        }
        else {
            if (this.year < 9999) {
                result = new Month(MonthConstants.JANUARY, this.year + 1);
            }
            else {
                result = null;
            }
        }
        return result;
    }

    /**
     * Returns a serial index number for the month.
     *
     * @return The serial index number.
     */
    public getSerialIndex(): number {
        return this.year * 12 + this.month;
    }

    /**
     * Returns a string representing the month (e.g. "January 2002").
     * <P>
     * To do: look at internationalisation.
     *
     * @return A string representing the month.
     */
    public toString(): string {
        return MonthConstants.toMonthName(this.month) + " " + this.year;
    }

    /**
     * Tests the equality of this Month object to an arbitrary object.
     * Returns true if the target is a Month instance representing the same
     * month as this object.  In all other cases, returns false.
     *
     * @param obj  the object (<code>null</code> permitted).
     *
     * @return <code>true</code> if month and year of this and object are the
     *         same.
     */
    public equals(obj: Object): boolean {
        if (obj == this) {
            return true;
        }
        if (!(obj instanceof Month)) {
            return false;
        }
        var that: Month = <Month>obj;
        if (this.month != that.month) {
            return false;
        }
        if (this.year != that.year) {
            return false;
        }
        return true;
    }

    /**
     * Returns a hash code for this object instance.  The approach described by
     * Joshua Bloch in "Effective Java" has been used here:
     * <p>
     * <code>http://developer.java.sun.com/developer/Books/effectivejava
     * /Chapter3.pdf</code>
     *
     * @return A hash code.
     */
    public hashCode(): number {
        var result: number = 17;
        result = 37 * result + this.month;
        result = 37 * result + this.year;
        return result;
    }

    /**
     * Returns an integer indicating the order of this Month object relative to
     * the specified
     * object: negative == before, zero == same, positive == after.
     *
     * @param o1  the object to compare.
     *
     * @return negative == before, zero == same, positive == after.
     */
    public compareTo(o1: Object): number {
        var result: number;
        // CASE 1 : Comparing to another Month object
        // --------------------------------------------
        if (o1 instanceof Month) {
            var m: Month = <Month>o1;
            result = this.year - m.getYearValue();
            if (result == 0) {
                result = this.month - m.getMonth();
            }
        }

        // CASE 2 : Comparing to another TimePeriod object
        // -----------------------------------------------
        else if (o1 instanceof AbstractRegularTimePeriod) {
            // more difficult case - evaluate later...
            result = 0;
        }

        // CASE 3 : Comparing to a non-TimePeriod object
        // ---------------------------------------------
        else {
            // consider time periods to be ordered after general objects
            result = 1;
        }

        return result;

    }


    /**
     * Parses the string argument as a month.  This method is required to
     * accept the format "YYYY-MM".  It will also accept "MM-YYYY". Anything
     * else, at the moment, is a bonus.
     *
     * @param s  the string to parse (<code>null</code> permitted).
     *
     * @return <code>null</code> if the string is not parseable, the month
     *         otherwise.
     */
    public static parseMonth(s: string): Month {
        var result: Month = null;
        if (s == null) {
            return result;
        }
        // trim whitespace from either end of the string
        s = s.trim();
        var i: number = Month.findSeparator(s);
        var s1: string;
        var s2: string;
        var yearIsFirst: boolean;
        // if there is no separator, we assume the first four characters
        // are YYYY
        if (i == -1) {
            yearIsFirst = true;
            s1 = s.substring(0, 5);
            s2 = s.substring(5);
        }
        else {
            s1 = s.substring(0, i).trim();
            s2 = s.substring(i + 1, s.length).trim();
            // now it is trickier to determine if the month or year is first
            var y1: Year = Month.evaluateAsYear(s1);
            if (y1 == null) {
                yearIsFirst = false;
            }
            else {
                var y2: Year = Month.evaluateAsYear(s2);
                if (y2 == null) {
                    yearIsFirst = true;
                }
                else {
                    yearIsFirst = (s1.length > s2.length);
                }
            }
        }
        var year: Year;
        var month: number;
        if (yearIsFirst) {
            year = Month.evaluateAsYear(s1);
            month = TimeUtil.stringToMonthCode(s2);
        }
        else {
            year = Month.evaluateAsYear(s2);
            month = TimeUtil.stringToMonthCode(s1);
        }
        if (month == -1) {
            throw Error("Can't evaluate the month.");
        }
        if (year == null) {
            throw new Error("Can't evaluate the year.");
        }
        result = new Month(month, year.getYear());
        console.log("Parse result="+result);
        return result;
    }

    /**
     * Finds the first occurrence of '-', or if that character is not found,
     * the first occurrence of ',', or the first occurrence of ' ' or '.'
     *
     * @param s  the string to parse.
     *
     * @return The position of the separator character, or <code>-1</code> if
     *     none of the characters were found.
     */
    private static findSeparator(s: string): number {
        var result: number = s.indexOf('-');
        if (result == -1) {
            result = s.indexOf(',');
        }
        if (result == -1) {
            result = s.indexOf(' ');
        }
        if (result == -1) {
            result = s.indexOf('.');
        }
        return result;
    }

    /**
     * Creates a year from a string, or returns <code>null</code> (format
     * exceptions suppressed).
     *
     * @param s  the string to parse.
     *
     * @return <code>null</code> if the string is not parseable, the year
     *         otherwise.
     */
    private static evaluateAsYear(s: string): Year {
        var result: Year = null;
        try {
            result = Year.parseYear(s);
        }
        catch (e) {
            // suppress
        }
        return result;
    }

}
