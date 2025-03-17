import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import AppTheme from '../shared-theme/AppTheme';
import AppAppBar from './AppAppBar';
import Hero from './Hero';
import LogoCollection from './LogoCollection';
import Highlights from './Highlights';
import Pricing from './Pricing';
import Features from './Features';
import Testimonials from './Testimonials';
import FAQ from './FAQ';
import Footer from './Footer';

export default function MarketingPage(props) {
  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <AppAppBar />
      <Hero />
      <div>
        {/* <LogoCollection /> */}
        <Features />
        <Divider />
        {/* <Testimonials /> */}
        <Divider />
        {/* <Highlights /> */}
        <Divider />
        {/* <Pricing /> */}
        <Divider />
        <FAQ />
        <Divider />
        <Footer />
      </div>
    </AppTheme>
  );
}
