import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import * as GardenBadges from './GardenBadges';

describe('GardenBadges Components', () => {
    const badgeComponents = Object.entries(GardenBadges).filter(([key]) => key !== 'ALL_BADGES');

    test.each(badgeComponents)('renders %s correctly', (name, Component) => {
        const { container } = render(<Component />);
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
        expect(svg).toHaveAttribute('width', '80');
        expect(svg).toHaveAttribute('height', '80');
    });

    test.each(badgeComponents)('renders %s with custom size', (name, Component) => {
        const { container } = render(<Component size={100} />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('width', '100');
        expect(svg).toHaveAttribute('height', '100');
    });

    test.each(badgeComponents)('renders %s as earned', (name, Component) => {
        const { container } = render(<Component earned={true} />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveStyle('opacity: 1');
        expect(svg).toHaveStyle('filter: none');
    });

    test.each(badgeComponents)('renders %s as not earned', (name, Component) => {
        const { container } = render(<Component earned={false} />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveStyle('opacity: 0.3');
        expect(svg).toHaveStyle('filter: grayscale(100%)');
    });

    test('ALL_BADGES contains all exported badges', () => {
        const exportedComponentNames = badgeComponents.map(([name]) => name);
        const listedComponentNames = GardenBadges.ALL_BADGES.map(badge => badge.component.name);

        // Check if all listed badges are actually exported components
        listedComponentNames.forEach(name => {
            expect(exportedComponentNames).toContain(name);
        });

        // Check structure of ALL_BADGES items
        GardenBadges.ALL_BADGES.forEach(badge => {
            expect(badge).toHaveProperty('name');
            expect(badge).toHaveProperty('nameKey');
            expect(badge).toHaveProperty('component');
            expect(badge).toHaveProperty('category');
            expect(badge).toHaveProperty('categoryKey');
            expect(badge).toHaveProperty('descriptionKey');
        });
    });
});
