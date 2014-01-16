#!/usr/bin/perl
##########################################################################
## Filename:      buildTinyMCE.pl
## Description:   Builds TinyMCE and copies output files to the correct 
##                TTWeb directories
##
## Copyright © 1996-2014 Seapine Software, Inc.
## All contents of this file are considered Seapine Software proprietary.
##########################################################################   

# This script must be run from the TTPro/WebControls/tinymce/tools directory, and is assuming that
# a complete TestTrack repository is already in place

use File::Copy qw(copy);    
use Cwd;

$curdir = cwd;
$buildCommand = 'jake clean';

# Change to the tinymce directory
chdir('../');

# Clean up the old builds
print 'Cleaning up old builds...';
$buildResult = `$buildCommand`;
if ($? != 0 ) 
{
   print "\n***Build Failed with command: $buildCommand. Exiting.\n$!\n";
   exit 1;
}
print "done\n";

# Build TinyMCE
print 'Building TinyMCE...';
$buildCommand = 'jake bundle-full-jquery[themes:modern,plugins:autoresize,code,fullpage,lists,paste,seapine,sproutcore,table]';
$buildResult = `$buildCommand`;
if ($? != 0 ) 
{
   print "\n***Build Failed with command: $buildCommand. Exiting.\n$!\n";
   exit 1;
}
print "done\n";

# Copy files to ttweb directory
print 'Copying tinymce.jquery.full.js to tiny_mce_combined.js...';
$filename = 'js/tinymce/tinymce.jquery.full.js';
$destination = '../../cgi/TTWeb/TTWeb/frameworks/tinymce-sproutcore/lib/tiny_mce_combined.js';
unless (-e $filename) {
   print "\n***Build failed: Cannot find file $filename";
   exit 1;
}
copy($filename, $destination) or die "\n***Copy failed: $!";
print "done\n";

print 'Copying skin.min.css...';
$filename = 'js/tinymce/skins/lightgray/skin.min.css';
$destination = '../../cgi/TTWeb/TTWeb/frameworks/tinymce-sproutcore/resources/stylesheet/skin.min.css';
unless (-e $filename) {
   print "\n***Build failed: Cannot find file $filename";
   exit 1;
}
copy($filename, $destination) or die "\n***Copy failed: $!";
print "done\n";

print "Build successful. Happy WYSIWYGing!\n\n";
