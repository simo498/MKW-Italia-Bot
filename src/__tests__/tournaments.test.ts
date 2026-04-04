// Mock modules that are not relevant to pure data-model logic and whose
// transitive imports would throw at load time (missing env vars, Discord API, etc.).
jest.mock('../application');
jest.mock('../log');
jest.mock('../tournament_manager/tournament_repo');
jest.mock('../tournament_manager/events');
jest.mock('../interaction/tournament_commands/common');

import { Tournament, TournamentPlayerEntry } from '../tournament_manager/tournaments';
import { ObjectId } from 'mongodb';

// ---------------------------------------------------------------------------
// TournamentPlayerEntry
// ---------------------------------------------------------------------------

describe('TournamentPlayerEntry', () => {
    it('stores playerId and joinDateTime', () => {
        const date = new Date('2024-01-01T12:00:00Z');
        const entry = new TournamentPlayerEntry('user1', date);
        expect(entry.playerId).toBe('user1');
        expect(entry.joinDateTime).toBe(date);
    });

    it('stores an optional displayName', () => {
        const entry = new TournamentPlayerEntry('user2', new Date(), 'Mario');
        expect(entry.displayName).toBe('Mario');
    });

    it('defaults displayName to an empty string when omitted', () => {
        const entry = new TournamentPlayerEntry('user3', new Date());
        expect(entry.displayName).toBe('');
    });

    it('defaults checkedIn to false', () => {
        const entry = new TournamentPlayerEntry('user4', new Date());
        expect(entry.checkedIn).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Tournament – construction and basic getters/setters
// ---------------------------------------------------------------------------

describe('Tournament – construction', () => {
    it('stores the initial dateTime, name, and mode', () => {
        const date = new Date('2024-06-15T18:00:00Z');
        const t = new Tournament(date, 'Grand Prix', '200cc');
        expect(t.getDateTime()).toBe(date);
        expect(t.getName()).toBe('Grand Prix');
        expect(t.getMode()).toBe('200cc');
    });

    it('generates a unique ObjectId on construction', () => {
        const t1 = new Tournament(new Date(), 'T1', '150cc');
        const t2 = new Tournament(new Date(), 'T2', '150cc');
        expect(t1.getId()).not.toEqual(t2.getId());
    });

    it('isCompiled defaults to true', () => {
        const t = new Tournament(new Date(), 'T', 'mode');
        expect(t.isCompiled).toBe(true);
    });

    it('players array is empty by default', () => {
        const t = new Tournament(new Date(), 'T', 'mode');
        expect(t.getPlayers()).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// Tournament – setters
// ---------------------------------------------------------------------------

describe('Tournament – setters', () => {
    let t: Tournament;
    beforeEach(() => {
        t = new Tournament(new Date(), 'Original', '150cc');
    });

    it('setName updates the name', () => {
        t.setName('New Name');
        expect(t.getName()).toBe('New Name');
    });

    it('setDateTime updates the date', () => {
        const newDate = new Date('2025-01-01');
        t.setDateTime(newDate);
        expect(t.getDateTime()).toBe(newDate);
    });

    it('setMode updates the mode', () => {
        t.setMode('200cc');
        expect(t.getMode()).toBe('200cc');
    });

    it('setNumberOfRaces stores the value', () => {
        t.setNumberOfRaces(12);
        expect(t.getNumberOfRaces()).toBe(12);
    });

    it('setMinPlayers stores the value', () => {
        t.setMinPlayers(4);
        expect(t.getMinPlayers()).toBe(4);
    });

    it('setMaxPlayers stores the value', () => {
        t.setMaxPlayers(16);
        expect(t.getMaxPlayers()).toBe(16);
    });

    it('setDescription stores the value', () => {
        t.setDescription('A fun tournament');
        expect(t.getDescription()).toBe('A fun tournament');
    });

    it('setDescription with undefined clears it', () => {
        t.setDescription('initial');
        t.setDescription(undefined);
        expect(t.getDescription()).toBeUndefined();
    });

    it('setId replaces the _id', () => {
        const newId = new ObjectId();
        t.setId(newId);
        expect(t.getId()).toBe(newId);
    });

    it('setSecondBracketDate stores and retrieves the date', () => {
        const bracketDate = new Date('2025-07-01');
        t.setSecondBracketDate(bracketDate);
        expect(t.getSecondBracketDate()).toBe(bracketDate);
    });
});

// ---------------------------------------------------------------------------
// Tournament – player management
// ---------------------------------------------------------------------------

describe('Tournament – player management', () => {
    let t: Tournament;
    beforeEach(() => {
        t = new Tournament(new Date(), 'Cup', 'mode');
    });

    it('addPlayer adds a player', () => {
        t.addPlayer('u1');
        expect(t.getPlayers()).toHaveLength(1);
        expect(t.getPlayers()[0].playerId).toBe('u1');
    });

    it('addPlayer stores the displayName when provided', () => {
        t.addPlayer('u1', 'Luigi');
        expect(t.getPlayers()[0].displayName).toBe('Luigi');
    });

    it('addPlayer does not add the same player twice', () => {
        t.addPlayer('u1');
        t.addPlayer('u1');
        expect(t.getPlayers()).toHaveLength(1);
    });

    it('isPlayerPartecipating returns true for a registered player', () => {
        t.addPlayer('u1');
        expect(t.isPlayerPartecipating('u1')).toBe(true);
    });

    it('isPlayerPartecipating returns false for an unregistered player', () => {
        expect(t.isPlayerPartecipating('nobody')).toBe(false);
    });

    it('removePlayer removes an existing player', () => {
        t.addPlayer('u1');
        t.addPlayer('u2');
        t.removePlayer('u1');
        expect(t.getPlayers()).toHaveLength(1);
        expect(t.getPlayers()[0].playerId).toBe('u2');
    });

    it('removePlayer is a no-op for a player not in the list', () => {
        t.addPlayer('u1');
        t.removePlayer('unknown');
        expect(t.getPlayers()).toHaveLength(1);
    });

    it('getPlayers returns a copy, not the internal array', () => {
        t.addPlayer('u1');
        const copy = t.getPlayers();
        copy.push(new TournamentPlayerEntry('injected', new Date()));
        expect(t.getPlayers()).toHaveLength(1);
    });
});
