import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { EncyclopediaCardVersion } from './encyclopedia-card-version.entity';

@Entity('encyclopedia_contents')
export class EncyclopediaContent {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'version_id' })
    versionId: number;

    @ManyToOne(() => EncyclopediaCardVersion, (version) => version.contents, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'version_id' })
    version: EncyclopediaCardVersion;

    @Column({ name: 'content_key', length: 100, nullable: true })
    contentKey: string; // e.g., 'definition', 'evidence'

    @Column({ name: 'content_value', type: 'text', nullable: true })
    contentValue: string;
}
